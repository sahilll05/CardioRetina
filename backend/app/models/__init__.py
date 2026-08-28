# Import all models so SQLAlchemy's metadata and Alembic's autogenerate can see every table.
# Order matters: Organization must be imported before User and Patient (FK dependencies).
from app.models.organization import Organization  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.patient import Patient  # noqa: F401
from app.models.visit import Visit  # noqa: F401
from app.models.analysis import Analysis  # noqa: F401
