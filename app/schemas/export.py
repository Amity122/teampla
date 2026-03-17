from enum import Enum

from pydantic import BaseModel


class ExportFormat(str, Enum):
    slack = "slack"
    csv = "csv"
    plain_text = "plain_text"


class ExportRequest(BaseModel):
    session_id: str
    format: ExportFormat
