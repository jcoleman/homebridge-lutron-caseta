let counter = 0;

export const TestHelper = {
  promiseForChainedOperations: (operations) => {
    let chain = new Promise((resolve) => {
      resolve();
    });
    for (let operation of operations) {
      chain = chain.then((resolve) => {
        if (typeof(operation) == "function") {
          const result = operation();
          resolve(result);
        } else {
          throw new Exception("Operation was not function:", operation);
        }
      });
    }
  },

  wrapWithPromise: (fn) => {
    return new Promise((resolve) => {
      fn();
      resolve();
    });
  },

  chainedWrapWithPromise: (fn) => {
    return (_) => {
      return TestHelper.wrapWithPromise(fn);
    };
  },

  waitForMessageOnSocket: (socket) => {
    return new Promise((resolve) => {
      socket.once("data", resolve);
    });
  },

  chainedWaitForMessageOnSocket: (socket) => {
    return (_) => {
      return TestHelper.waitForMessageOnSocket(socket);
    };
  }
};
