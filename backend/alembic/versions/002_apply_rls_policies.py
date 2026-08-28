"""Apply RLS policies

Revision ID: 002_apply_rls
Revises: 56656cdd7e52
Create Date: 2026-08-28 16:03:00.000000

"""
from typing import Sequence, Union
import os
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_apply_rls'
down_revision: Union[str, None] = '56656cdd7e52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get the path to the SQL file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file = os.path.join(current_dir, '001_rls_multi_tenant_policies.sql')
    
    with open(sql_file, 'r') as f:
        sql = f.read()
        
    # Execute the SQL to apply RLS policies
    op.execute(sql)


def downgrade() -> None:
    # Drop the policies and disable RLS
    op.execute("DROP POLICY IF EXISTS tenant_patients_isolation ON patients;")
    op.execute("DROP POLICY IF EXISTS tenant_visits_isolation ON visits;")
    op.execute("DROP POLICY IF EXISTS tenant_analyses_isolation ON analyses;")
    op.execute("DROP POLICY IF EXISTS tenant_audit_log_select ON audit_log;")
    op.execute("DROP POLICY IF EXISTS tenant_audit_log_insert ON audit_log;")
    op.execute("DROP POLICY IF EXISTS tenant_audit_log_no_update ON audit_log;")
    op.execute("DROP POLICY IF EXISTS tenant_audit_log_no_delete ON audit_log;")
    
    op.execute("ALTER TABLE patients DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE visits DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;")
