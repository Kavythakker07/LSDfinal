const logError = ({
  route,
  error,
  extra = {}
}) => {
  console.error({
    type: "ERROR_LOG",
    route,
    error: error?.message || error,
    extra,
    time: new Date().toISOString()
  });
};

const logAdminAction = ({
  adminEmail,
  action,
  details = {}
}) => {
  console.log({
    type: "ADMIN_ACTION",
    adminEmail,
    action,
    details,
    time: new Date().toISOString()
  });
};

module.exports = {
  logError,
  logAdminAction
};