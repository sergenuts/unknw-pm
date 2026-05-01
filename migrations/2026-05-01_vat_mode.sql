-- Add three-mode VAT (none / excl / incl) to clients.
-- excl = sum is net, VAT charged on top in invoice
-- incl = sum is gross, VAT extracted from total in invoice
-- Backfills existing rows: vat=true → 'excl' (current behaviour was VAT-on-top).

alter table clients
  add column if not exists vat_mode text
    default 'none'
    check (vat_mode in ('none', 'excl', 'incl'));

update clients
  set vat_mode = case
    when vat is true then 'excl'
    else 'none'
  end
  where vat_mode is null or vat_mode = 'none' and vat is true;
