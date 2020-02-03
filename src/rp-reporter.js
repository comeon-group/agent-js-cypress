const Mocha = require("mocha");
const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_END,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_HOOK_BEGIN,
  EVENT_HOOK_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_PENDING
} = Mocha.Runner.constants;
const RPClient = require("reportportal-client");
const  { testItemStatuses, logLevels, entityType, hooksTypeMap } = require("./constants");
const { getBase64FileObject } = require("./reporter-utilities");

const { FAILED, SKIPPED } = testItemStatuses;
const { ERROR } = logLevels;

const getTempHookId = hook => `${hook.parent.id}_${hook.id}_${hook.hookName}`;

class ReportPortalReporter extends Mocha.reporters.Base {
  constructor(runner, config) {
    super(runner);
    this.runner = runner;
    this.client = new RPClient(config.reporterOptions);
    this.testItemIds = new Map();
    this.hookIds = new Map();

    runner.once(EVENT_RUN_BEGIN, async () => {
      try {
        const launch = {
          token: config.reporterOptions.token,
          name: config.reporterOptions.launch,
          description: config.reporterOptions.description,
          attributes: config.reporterOptions.attributes,
          startTime: new Date().valueOf()
        };

        const { tempId, promise } = this.client.startLaunch(launch);

        this.tempLaunchId = tempId;
        await promise;
      } catch (err) {
        console.error(`Failed to run launch. Error: ${err}`);
      }
    });

    runner.on(EVENT_SUITE_BEGIN, async suite => {
      try {
        await this.suiteStart(suite);
      } catch (err) {
        console.error(`Failed to create suite. Error: ${err}`);
      }
    });

    runner.on(EVENT_SUITE_END, async suite => {
      try {
        await this.suiteEnd(suite);
      } catch (err) {
        console.error(`Failed to finish suite. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_BEGIN, async test => {
      try {
        await this.testStart(test);
      } catch (err) {
        console.error(`Failed to create test item. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_END, async test => {
      const status = test.state === "pending" ? SKIPPED : test.state;
      try {
        if (status === FAILED) {
          this.sendLog(test);
        }
        await this.testFinished(test, { status });
      } catch (err) {
        console.error(`Failed to finish failed test item. Error: ${err}`);
      }
    });

    runner.once(EVENT_RUN_END, async () => {
      try {
        const { promise } = this.client.finishLaunch(this.tempLaunchId, {
          endTime: new Date().valueOf()
        });
        await promise;
      } catch (err) {
        console.error(`Failed to finish run. Error: ${err}`);
      }
    });

    runner.on(EVENT_HOOK_BEGIN, async hook => {
      try {
        console.log("start hook ", hook.title);
        await this.hookStart(hook);
      } catch (err) {
        console.error(`Failed to create test item. Error: ${err}`);
      }
    });

    runner.on(EVENT_HOOK_END, async hook => {
      try {
        console.log("finish hook ", hook.title);
        await this.hookFinished(hook);
      } catch (err) {
        console.error(`Failed to create test item. Error: ${err}`);
      }
    });

    runner.on(EVENT_HOOK_END, async hook => {
      try {
        console.log("finish hook ", hook.title);
        await this.hookFinished(hook);
      } catch (err) {
        console.error(`Failed to create test item. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_FAIL, (test) => {
      console.log('fail', test.title);
    });

    runner.on(EVENT_TEST_PENDING, test => {
      console.log("pending", test.title);
    });

    runner.on(EVENT_TEST_PASS, test => {
      console.log("pass", test.title);
    });
  }

  async suiteStart(suite) {
    if (!suite.title) {
      return;
    }
    console.log("start suite ", suite.title);

    const suiteStartObj = {
      type: entityType.SUITE,
      name: suite.title.slice(0, 255).toString(),
      startTime: new Date().valueOf(),
      description: suite.description,
      attributes: []
    };
    const parentId = !suite.root
      ? this.testItemIds.get(suite.parent.id)
      : undefined;

    const { tempId, promise } = this.client.startTestItem(
      suiteStartObj,
      this.tempLaunchId,
      parentId
    );
    this.testItemIds.set(suite.id, tempId);
    await promise;
  }

  async suiteEnd(suite) {
    if (!suite.title) {
      return;
    }
    console.log("finish suite ", suite.title);
    const suiteId = this.testItemIds.get(suite.id);
    const { promise } = this.client.finishTestItem(suiteId, {});

    await promise;
  }

  async testStart(test) {
    if (!test.title) {
      return;
    }
    console.log("start test ", test.title);
    const parentId = this.testItemIds.get(test.parent.id);
    const testStartObj = {
      type: entityType.STEP,
      name: test.title.slice(0, 255).toString(),
      startTime: new Date().valueOf(),
      attributes: []
    };

    const { tempId, promise } = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      parentId
    );

    this.testItemIds.set(test.id, tempId);
    await promise;
  }

  async sendLog(test) {
    const testId = this.testItemIds.get(test.id);
    const screenShotObj = getBase64FileObject(test.title);
    const message = test.err.stack;

    await this.client.sendLog(
      testId,
      {
        message,
        level: ERROR,
        time: new Date().valueOf()
      },
      screenShotObj
    );
  }

  async testFinished(test, finishTestObj) {
    console.log("finish test ", test.title);
    const testId = this.testItemIds.get(test.id);
    const { promise } = this.client.finishTestItem(testId, {
      endTime: new Date().valueOf(),
      ...finishTestObj
    });

    await promise;
  }

  async hookStart(hook) {
    if (!hook.hookName) return;
    const parentId = this.testItemIds.get(hook.parent.id);
    const hookTempId = getTempHookId(hook);
    const hookObj = {
      type: hooksTypeMap[hook.hookName],
      name: hook.hookName,
      description: hook.title,
      startTime: new Date().valueOf()
    };
    // const { tempId, promise } = this.client.startTestItem(
    //   hookObj,
    //   this.tempLaunchId,
    //   parentId
    // );

    // this.hookIds.set(hookTempId, tempId);
    // await promise;
  }

  async hookFinished(hook) {
    const hookTempId = getTempHookId(hook);
    const hookId = this.hookIds.get(hookTempId);
    // const { promise } = this.client.finishTestItem(hookId, {
    //   endTime: new Date().valueOf(),
    //   type: hooksTypeMap[hook.hookName],
    // });

    // await promise;
  }
}

module.exports = ReportPortalReporter;
