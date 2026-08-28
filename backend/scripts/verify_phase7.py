import asyncio
import os
import sys
from pathlib import Path

# Add backend dir to PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import async_engine, AsyncSessionLocal
from app.core.audit_chain import compute_row_hash, GENESIS_PREV_HASH
from app.ml_interface.pipeline_gateway import PipelineGateway
from sqlalchemy import text
from app.models.patient import Patient

async def verify_rls():
    """Verify Row Level Security Isolation (Task 7.4)"""
    print("\n--- Verifying Row-Level Security (Task 7.4) ---")
    async with AsyncSessionLocal() as session:
        try:
            # 1. Create a patient under org 1
            await session.execute(text("SET LOCAL app.current_org_id = '1'"))
            await session.execute(
                text("INSERT INTO patients (org_id, patient_id, name, age) VALUES (1, 'PAT-TEST-1', 'Test Patient 1', 30) ON CONFLICT DO NOTHING")
            )
            await session.commit()
            
            # 2. Try to read as org 2
            await session.execute(text("SET LOCAL app.current_org_id = '2'"))
            result = await session.execute(text("SELECT * FROM patients WHERE patient_id = 'PAT-TEST-1'"))
            patient = result.fetchone()
            
            if patient is None:
                print("[PASS] Cross-tenant read correctly blocked by RLS.")
            else:
                print("[FAIL] Cross-tenant read was permitted! RLS is failing.")
                
            # Clean up
            await session.execute(text("SET LOCAL app.current_org_id = '1'"))
            await session.execute(text("DELETE FROM patients WHERE patient_id = 'PAT-TEST-1'"))
            await session.commit()
        except Exception as e:
            if "authentication failed" in str(e) or "Connection refused" in str(e):
                print(f"[SKIP] RLS test skipped: No local database connection available ({e})")
            else:
                print(f"[FAIL] RLS test encountered error: {e}")
            await session.rollback()

async def verify_audit_log():
    """Verify Audit Log Tamper Detection (Task 7.5)"""
    print("\n--- Verifying Audit Log Tamper Detection (Task 7.5) ---")
    
    # Simulate an audit chain
    payload_1 = "11user:test_LOGIN"
    hash_1 = compute_row_hash(GENESIS_PREV_HASH, payload_1)
    
    payload_2 = "11user:test_LOGOUT"
    hash_2 = compute_row_hash(hash_1, payload_2)
    
    print("[INFO] Simulated valid audit chain created.")
    
    # Tamper with payload 1
    tampered_payload_1 = "11user:test_DELETE"
    tampered_hash_1 = compute_row_hash(GENESIS_PREV_HASH, tampered_payload_1)
    
    print(f"[INFO] Original Hash 1: {hash_1}")
    print(f"[INFO] Tampered Hash 1: {tampered_hash_1}")
    
    # Verify the chain is broken at link 2
    verification_hash_2 = compute_row_hash(tampered_hash_1, payload_2)
    if verification_hash_2 != hash_2:
        print("[PASS] Tampering successfully detected by hash chain.")
    else:
        print("[FAIL] Tampering was NOT detected! Hash chain is broken.")

def verify_config_externalization():
    """Verify Configuration Externalization (Task 7.9)"""
    print("\n--- Verifying Config Externalization (Task 7.9) ---")
    gateway = PipelineGateway()
    
    version = gateway.config_version
    print(f"[INFO] Loaded Config Version: {version}")
    
    if version == "v1-baseline":
        print("[PASS] Externalized pipeline config successfully loaded.")
    else:
        print(f"[FAIL] Expected 'v1-baseline', got '{version}'. Config not loaded correctly.")

def verify_shadow_isolation():
    """Verify Shadow Mode Tracks are Isolated (Tasks 7.8 & 7.10)"""
    print("\n--- Verifying Shadow Mode Isolation (Tasks 7.8 & 7.10) ---")
    
    import subprocess
    # Search for forbidden imports in production code
    target_dirs = ["app/api", "ml/pipeline", "ml/risk/risk_engine.py"]
    base_path = Path(__file__).resolve().parent.parent
    
    pass_flag = True
    
    for d in target_dirs:
        target_path = base_path / d
        if not target_path.exists():
            continue
            
        cmd = f'grep -r "risk_engine_ml" "{target_path}"'
        try:
            output = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, text=True)
            if output.strip():
                print(f"[FAIL] Found 'risk_engine_ml' reference in {d}. Shadow track is NOT isolated!")
                print(output)
                pass_flag = False
        except subprocess.CalledProcessError:
            pass # grep returns 1 if not found, which is what we want!

        cmd2 = f'grep -r "v2_foundation" "{target_path}"'
        try:
            output = subprocess.check_output(cmd2, shell=True, stderr=subprocess.STDOUT, text=True)
            if output.strip():
                print(f"[FAIL] Found 'v2_foundation' reference in {d}. Shadow track is NOT isolated!")
                print(output)
                pass_flag = False
        except subprocess.CalledProcessError:
            pass # not found
            
    if pass_flag:
        print("[PASS] No clinician-facing code paths import from shadow tracks (v2_foundation, risk_engine_ml).")


async def main():
    print("==================================================")
    print(" CardioRetina AI - Phase 7 Verification Audit")
    print("==================================================")
    
    await verify_rls()
    await verify_audit_log()
    verify_config_externalization()
    verify_shadow_isolation()
    
    print("\n==================================================")
    print(" Audit Script Execution Completed.")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
