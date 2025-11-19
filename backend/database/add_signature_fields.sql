-- Add signature fields to onboarding_processes table
ALTER TABLE onboarding_processes 
ADD COLUMN IF NOT EXISTS signature_url TEXT NULL,
ADD COLUMN IF NOT EXISTS signature_request_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS document_path VARCHAR(500) NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_signature_request_id ON onboarding_processes(signature_request_id);

