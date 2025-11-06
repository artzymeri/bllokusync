-- Check for duplicates in October 2025
SELECT
    tenant_id,
    property_id,
    payment_month,
    COUNT(*) as count,
    GROUP_CONCAT(id ORDER BY id) as payment_ids,
    GROUP_CONCAT(status ORDER BY id) as statuses
FROM tenant_payments
WHERE payment_month = '2025-10-01'
GROUP BY tenant_id, property_id, payment_month
ORDER BY count DESC, tenant_id;

