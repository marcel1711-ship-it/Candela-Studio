/*
  # Make phone column nullable in leads table

  The booking form does not collect a phone number, causing inserts to fail
  because phone was defined as NOT NULL. This migration relaxes that constraint.
*/

ALTER TABLE leads ALTER COLUMN phone DROP NOT NULL;
