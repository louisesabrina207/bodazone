const SUCCESSFUL_PAYMENT_STATUSES = ['verified', 'paid'];

const normalizePaymentStatus = (status) => {
  if (!status || typeof status !== 'string') return status;

  const normalized = status.toLowerCase();
  if (normalized === 'paid') return 'verified';

  return normalized;
};

const isSuccessfulPaymentStatus = (status) => {
  const normalized = normalizePaymentStatus(status);
  return SUCCESSFUL_PAYMENT_STATUSES.includes(normalized || '');
};

module.exports = {
  SUCCESSFUL_PAYMENT_STATUSES,
  normalizePaymentStatus,
  isSuccessfulPaymentStatus
};
