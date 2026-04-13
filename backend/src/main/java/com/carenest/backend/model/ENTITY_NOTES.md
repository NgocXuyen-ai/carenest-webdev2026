Package suggestion: com.carenest.backend.entity

Notes:
- Files map the uploaded PostgreSQL schema as-is, including quoted table name "USER".
- Notification.referenceId is left as a scalar because the schema uses one column to point to multiple tables.
- MedicineSchedule.scheduleId is not auto-generated because the uploaded schema did not mark it increment=true.
- OcrSession.structureData uses Hibernate 6 JSON mapping.
