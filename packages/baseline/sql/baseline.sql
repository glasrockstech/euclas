BEGIN;
CREATE ROLE euclas_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
@LOGIN_ROLES@
REVOKE ALL ON DATABASE postgres FROM PUBLIC;
GRANT CONNECT ON DATABASE postgres TO euclas_migration, euclas_application, euclas_storage, euclas_verifier;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA baseline AUTHORIZATION euclas_owner;
GRANT EXECUTE ON FUNCTION pg_catalog.pg_control_system() TO euclas_owner;
SET LOCAL ROLE euclas_owner;
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON SEQUENCES FROM PUBLIC;

CREATE TABLE baseline.authority (
  instance_id uuid PRIMARY KEY,
  controller_id uuid NOT NULL,
  data_location_id uuid NOT NULL,
  ownership_epoch bigint NOT NULL CHECK (ownership_epoch BETWEEN 1 AND 9007199254740991),
  root_hash text NOT NULL CHECK (root_hash ~ '^sha256:[0-9a-f]{64}$'),
  staging_hash text NOT NULL CHECK (staging_hash ~ '^sha256:[0-9a-f]{64}$'),
  manifest_hash text NOT NULL CHECK (manifest_hash ~ '^sha256:[0-9a-f]{64}$'),
  active boolean NOT NULL
);
@AUTHORITY@
CREATE TABLE baseline.reader (
  login name PRIMARY KEY,
  instance_id uuid NOT NULL REFERENCES baseline.authority(instance_id)
);
INSERT INTO baseline.reader SELECT r, instance_id FROM baseline.authority,
  unnest(ARRAY['euclas_migration','euclas_application','euclas_storage','euclas_verifier']::name[]) AS r;

CREATE FUNCTION baseline.visible_instance() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, baseline AS $$
  SELECT a.instance_id FROM baseline.authority a JOIN baseline.reader r USING(instance_id)
  WHERE r.login = session_user AND a.active
$$;

CREATE TABLE baseline.record (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  instance_id uuid NOT NULL REFERENCES baseline.authority(instance_id),
  operation_id uuid NOT NULL UNIQUE,
  idempotency_key uuid NOT NULL UNIQUE,
  receipt_id uuid NOT NULL UNIQUE,
  request_hash text NOT NULL CHECK (request_hash ~ '^sha256:[0-9a-f]{64}$'),
  request jsonb NOT NULL CHECK(jsonb_typeof(request)='object'),
  receipt jsonb NOT NULL CHECK(jsonb_typeof(receipt)='object'),
  revision bigint NOT NULL CHECK(revision=1)
);
ALTER TABLE baseline.record ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline.record FORCE ROW LEVEL SECURITY;
CREATE POLICY instance_scope ON baseline.record
  USING(instance_id=baseline.visible_instance()) WITH CHECK(instance_id=baseline.visible_instance());

CREATE FUNCTION baseline.apply(p_hash text, p_request jsonb, p_receipt jsonb, p_expected bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, baseline AS $$
DECLARE
  a baseline.authority;
  previous baseline.record;
  payload jsonb := p_request->'payload';
BEGIN
  IF session_user <> 'euclas_migration' THEN RAISE EXCEPTION 'denied' USING ERRCODE='42501'; END IF;
  SELECT auth.* INTO a FROM baseline.authority auth JOIN baseline.reader r USING(instance_id)
    WHERE r.login=session_user FOR UPDATE OF auth;
  IF NOT FOUND OR NOT a.active THEN RAISE EXCEPTION 'denied' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_request) IS DISTINCT FROM 'object' OR jsonb_typeof(payload) IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_receipt) IS DISTINCT FROM 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(p_request))<>11
    OR (SELECT count(*) FROM jsonb_object_keys(payload))<>5
    OR (SELECT count(*) FROM jsonb_object_keys(p_receipt))<>13
    OR (p_request - ARRAY['protocol_version','request_id','instance_id','controller_id','ownership_epoch','expected_revision',
      'idempotency_key','nonce','command','authorization_permit','payload']) <> '{}'::jsonb
    OR (payload - ARRAY['operation_id','instance_id','data_location_id','baseline_id','migration_manifest_hash']) <> '{}'::jsonb
    OR (p_receipt - ARRAY['receipt_id','request_hash','operation_id','instance_id','controller_id','ownership_epoch','data_location_id',
      'data_root_identity_hash','staging_identity_hash','cluster_system_identifier','baseline_id','migration_manifest_hash','revision']) <> '{}'::jsonb
    THEN RAISE EXCEPTION 'invalid_input' USING ERRCODE='22023'; END IF;
  IF (p_request->>'instance_id')::uuid IS DISTINCT FROM a.instance_id
    OR (payload->>'instance_id')::uuid IS DISTINCT FROM a.instance_id
    OR (p_request->>'controller_id')::uuid IS DISTINCT FROM a.controller_id
    OR (payload->>'data_location_id')::uuid IS DISTINCT FROM a.data_location_id
    OR (p_request->>'ownership_epoch')::bigint IS DISTINCT FROM a.ownership_epoch
    THEN RAISE EXCEPTION 'denied' USING ERRCODE='42501'; END IF;
  IF p_hash IS NULL OR p_hash !~ '^sha256:[0-9a-f]{64}$'
    OR p_request->'protocol_version' IS DISTINCT FROM '1'::jsonb OR p_request->>'command' IS DISTINCT FROM 'initialize'
    OR p_request->'authorization_permit' IS DISTINCT FROM 'null'::jsonb
    OR (p_request->>'nonce') IS NULL OR (p_request->>'nonce') !~ '^[A-Za-z0-9_-]+$'
    OR length(p_request->>'nonce') NOT BETWEEN 43 AND 2048
    OR (p_request->>'request_id')::uuid IS NULL OR (p_request->>'idempotency_key')::uuid IS NULL
    OR jsonb_typeof(p_request->'ownership_epoch') IS DISTINCT FROM 'number'
    OR jsonb_typeof(p_request->'expected_revision') IS DISTINCT FROM 'number'
    OR jsonb_typeof(p_request->'nonce') IS DISTINCT FROM 'string'
    OR EXISTS(SELECT 1 FROM jsonb_each(p_request) e WHERE e.key IN ('request_id','instance_id','controller_id','idempotency_key')
      AND (jsonb_typeof(e.value)<>'string' OR e.value#>>'{}' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'))
    OR EXISTS(SELECT 1 FROM jsonb_each(payload) e WHERE e.key IN ('operation_id','instance_id','data_location_id')
      AND (jsonb_typeof(e.value)<>'string' OR e.value#>>'{}' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'))
    OR EXISTS(SELECT 1 FROM jsonb_each(p_receipt) e WHERE e.key IN ('receipt_id','operation_id','instance_id','controller_id','data_location_id')
      AND (jsonb_typeof(e.value)<>'string' OR e.value#>>'{}' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'))
    OR p_expected IS NULL OR p_expected<0 OR p_expected>9007199254740991
    OR (payload->>'operation_id')::uuid IS NULL
    OR (p_request->>'expected_revision')::bigint IS DISTINCT FROM p_expected
    OR p_receipt->>'request_hash' IS DISTINCT FROM p_hash
    OR p_receipt->>'instance_id' IS DISTINCT FROM p_request->>'instance_id'
    OR p_receipt->>'controller_id' IS DISTINCT FROM p_request->>'controller_id'
    OR p_receipt->'ownership_epoch' IS DISTINCT FROM p_request->'ownership_epoch'
    OR p_receipt->>'operation_id' IS DISTINCT FROM payload->>'operation_id'
    OR p_receipt->>'data_location_id' IS DISTINCT FROM payload->>'data_location_id'
    OR p_receipt->>'data_root_identity_hash' IS DISTINCT FROM a.root_hash
    OR p_receipt->>'staging_identity_hash' IS DISTINCT FROM a.staging_hash
    OR p_receipt->>'migration_manifest_hash' IS DISTINCT FROM a.manifest_hash
    OR payload->>'migration_manifest_hash' IS DISTINCT FROM a.manifest_hash
    OR payload->>'baseline_id' IS DISTINCT FROM 'euclas-d92-v1'
    OR p_receipt->>'baseline_id' IS DISTINCT FROM 'euclas-d92-v1'
    OR p_receipt->'revision' IS DISTINCT FROM '6'::jsonb
    OR jsonb_typeof(p_receipt->'cluster_system_identifier') IS DISTINCT FROM 'string'
    OR (p_receipt->>'receipt_id')::uuid IS NULL
    OR p_receipt->>'cluster_system_identifier' IS DISTINCT FROM (SELECT system_identifier::text FROM pg_catalog.pg_control_system())
    THEN RAISE EXCEPTION 'invalid_input' USING ERRCODE='22023'; END IF;
  SELECT * INTO previous FROM baseline.record FOR UPDATE;
  IF FOUND THEN
    IF previous.idempotency_key=(p_request->>'idempotency_key')::uuid THEN
      IF previous.request_hash<>p_hash OR previous.request<>p_request OR previous.receipt<>p_receipt
        THEN RAISE EXCEPTION 'conflict' USING ERRCODE='23505'; END IF;
      RETURN previous.receipt;
    END IF;
    IF p_expected<>previous.revision THEN RAISE EXCEPTION 'stale_revision' USING ERRCODE='40001'; END IF;
    RAISE EXCEPTION 'conflict' USING ERRCODE='23505';
  END IF;
  IF p_expected<>0 THEN RAISE EXCEPTION 'stale_revision' USING ERRCODE='40001'; END IF;
  INSERT INTO baseline.record VALUES (true, a.instance_id, (payload->>'operation_id')::uuid,
    (p_request->>'idempotency_key')::uuid, (p_receipt->>'receipt_id')::uuid, p_hash, p_request, p_receipt, 1);
  RETURN p_receipt;
END
$$;

CREATE FUNCTION baseline.inspect(p_instance uuid, p_controller uuid, p_epoch bigint, p_location uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,baseline AS $$
DECLARE a baseline.authority;
BEGIN
  SELECT auth.* INTO a FROM baseline.authority auth JOIN baseline.reader r USING(instance_id)
    WHERE r.login=session_user FOR SHARE OF auth,r;
  IF NOT FOUND OR NOT a.active OR a.instance_id IS DISTINCT FROM p_instance OR a.controller_id IS DISTINCT FROM p_controller
    OR a.ownership_epoch IS DISTINCT FROM p_epoch OR a.data_location_id IS DISTINCT FROM p_location
    THEN RAISE EXCEPTION 'denied' USING ERRCODE='42501'; END IF;
  RETURN (SELECT receipt FROM baseline.record);
END
$$;

REVOKE ALL ON ALL TABLES IN SCHEMA baseline FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA baseline FROM PUBLIC;
GRANT USAGE ON SCHEMA baseline TO euclas_migration, euclas_application, euclas_storage, euclas_verifier;
GRANT SELECT ON baseline.record TO euclas_migration, euclas_application, euclas_storage, euclas_verifier;
GRANT EXECUTE ON FUNCTION baseline.visible_instance(), baseline.inspect(uuid,uuid,bigint,uuid) TO euclas_migration, euclas_application, euclas_storage, euclas_verifier;
GRANT EXECUTE ON FUNCTION baseline.apply(text,jsonb,jsonb,bigint) TO euclas_migration;
COMMIT;
