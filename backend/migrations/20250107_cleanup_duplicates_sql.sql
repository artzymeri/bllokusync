-- Direct SQL cleanup of duplicate payment records
-- Simpler approach: Delete duplicates keeping the lowest ID for paid records, or lowest ID overall

DELETE t1 FROM tenant_payments t1
INNER JOIN tenant_payments t2
WHERE t1.tenant_id = t2.tenant_id
  AND t1.property_id = t2.property_id
  AND t1.payment_month = t2.payment_month
  AND (
    -- If there's a paid record, delete all non-paid ones
    (t2.status = 'paid' AND t1.status != 'paid')
    OR
    -- If both have same status, keep the one with lower ID (older record)
    (t1.status = t2.status AND t1.id > t2.id)
  );
