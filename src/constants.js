const testItemStatuses = {
    PASSED: "passed",
    FAILED: "failed",
    SKIPPED: "skipped"
  };
const logLevels = {
    ERROR: "error",
    TRACE: "trace",
    DEBUG: "debug",
    INFO: "info",
    WARN: "warn"
  };
const entityType = {
  SUITE: "suite",
  STEP: "step",
  BEFORE_METHOD: "BEFORE_METHOD",
  BEFORE_SUITE: "BEFORE_SUITE",
  AFTER_METHOD: "AFTER_METHOD",
  AFTER_SUITE: "AFTER_SUITE"
};
const hooksTypeMap = {
  "before each": entityType.BEFORE_METHOD,
  "before all": entityType.BEFORE_SUITE,
  "after each": entityType.AFTER_METHOD,
  "after all": entityType.AFTER_SUITE
};


module.exports = { testItemStatuses, logLevels, entityType, hooksTypeMap };
