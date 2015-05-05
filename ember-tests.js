var JSHINTRC = {
    "predef": [
        "QUnit",
        "define",
        "console",
        "Ember",
        "DS",
        "Handlebars",
        "Metamorph",
        "RSVP",
        "require",
        "requireModule",
        "equal",
        "notEqual",
        "notStrictEqual",
        "test",
        "asyncTest",
        "testBoth",
        "testWithDefault",
        "raises",
        "throws",
        "deepEqual",
        "start",
        "stop",
        "ok",
        "strictEqual",
        "module",
        "expect",
        "minispade",
        "expectAssertion",

        // A safe subset of "browser:true":
        "window", "location", "document", "XMLSerializer",
        "setTimeout", "clearTimeout", "setInterval", "clearInterval"
    ],

    "node" : false,
    "browser" : false,

    "boss" : true,
    "curly": false,
    "debug": false,
    "devel": false,
    "eqeqeq": true,
    "evil": true,
    "forin": false,
    "immed": false,
    "laxbreak": false,
    "newcap": true,
    "noarg": true,
    "noempty": false,
    "nonew": false,
    "nomen": false,
    "onevar": false,
    "plusplus": false,
    "regexp": false,
    "undef": true,
    "sub": true,
    "strict": false,
    "white": false,
    "eqnull": true
}
;

minispade.register('ember-states/~tests/state_manager_test', "(function() {var get = Ember.get, set = Ember.set;\n\nvar stateManager, loadingState, loadedState, stateEventStub = {\n  entered: 0,\n  enter: function() {\n    this.entered++;\n  },\n\n  exited: 0,\n  exit: function() {\n    this.exited++;\n  },\n\n  reset: function() {\n    this.entered = 0;\n    this.exited = 0;\n  }\n};\n\nmodule(\"Ember.StateManager\", {\n  setup: function() {\n    loadingState = Ember.State.create(stateEventStub);\n    loadedState = Ember.State.create(stateEventStub, {\n      empty: Ember.State.create(stateEventStub)\n    });\n\n    stateManager = Ember.StateManager.create({\n      loadingState: loadingState,\n      loadedState: loadedState\n    });\n  },\n\n  teardown: function() {\n    Ember.run(function() {\n      if (stateManager) {\n        stateManager.destroy();\n      }\n    });\n  }\n});\n\ntest(\"it exists\", function() {\n  ok(Ember.Object.detect(Ember.StateManager), \"Ember.StateManager is an Ember.Object\");\n});\n\ntest(\"it discovers states set in its state property\", function() {\n  var states = {\n    loading: Ember.State.create(),\n    loaded: Ember.State.create()\n  };\n\n  stateManager = Ember.StateManager.create({\n    states: states\n  });\n\n  equal(states, stateManager.get('states'), \"reports same states as were set\");\n});\n\ntest(\"it discovers states that are properties of the state manager\", function() {\n  stateManager = Ember.StateManager.create({\n    loading: Ember.State.create(),\n    loaded: Ember.State.create()\n  });\n\n  var states = stateManager.get('states');\n  ok(get(states, 'loading'), \"found loading state\");\n  ok(get(states, 'loaded'), \"found loaded state\");\n});\n\ntest(\"it reports its current state\", function() {\n  ok(get(stateManager, 'currentState') === null, \"currentState defaults to null if no state is specified\");\n\n  stateManager.transitionTo('loadingState');\n  ok(get(stateManager, 'currentState') === loadingState, \"currentState changes after transitionTo() is called\");\n\n  stateManager.transitionTo('loadedState');\n  ok(get(stateManager, 'currentState') === loadedState, \"currentState can change to a sibling state\");\n});\n\ntest(\"it reports its current state path\", function() {\n  strictEqual(get(stateManager, 'currentPath'), null, \"currentPath defaults to null if no state is specified\");\n\n  stateManager.transitionTo('loadingState');\n  equal(get(stateManager, 'currentPath'), 'loadingState', \"currentPath changes after transitionTo() is called\");\n\n  stateManager.transitionTo('loadedState');\n  equal(get(stateManager, 'currentPath'), 'loadedState', \"currentPath can change to a sibling state\");\n});\n\ntest(\"it sends enter and exit events during state transitions\", function() {\n  stateManager.transitionTo('loadingState');\n\n  equal(loadingState.entered, 1, \"state should receive one enter event\");\n  equal(loadingState.exited, 0, \"state should not have received an exit event\");\n  equal(loadedState.entered, 0, \"sibling state should not have received enter event\");\n  equal(loadedState.exited, 0, \"sibling state should not have received exited event\");\n\n  loadingState.reset();\n  loadedState.reset();\n\n  stateManager.transitionTo('loadedState');\n  equal(loadingState.entered, 0, \"state should not receive an enter event\");\n  equal(loadingState.exited, 1, \"state should receive one exit event\");\n  equal(loadedState.entered, 1, \"sibling state should receive one enter event\");\n  equal(loadedState.exited, 0, \"sibling state should not have received exited event\");\n\n  loadingState.reset();\n  loadedState.reset();\n\n  stateManager.transitionTo('loadingState');\n\n  equal(loadingState.entered, 1, \"state should receive one enter event\");\n  equal(loadingState.exited, 0, \"state should not have received an exit event\");\n  equal(loadedState.entered, 0, \"sibling state should not have received enter event\");\n  equal(loadedState.exited, 1, \"sibling state should receive one exit event\");\n});\n\ntest(\"it accepts absolute paths when changing states\", function() {\n  var emptyState = loadedState.empty;\n\n  stateManager.transitionTo('loadingState');\n\n  stateManager.transitionTo('loadedState.empty');\n\n  equal(emptyState.entered, 1, \"sends enter event to substate\");\n  equal(emptyState.exited, 0, \"does not send exit event to substate\");\n  ok(stateManager.get('currentState') === emptyState, \"updates currentState property to state at absolute path\");\n});\n\ntest(\"it does not enter an infinite loop in transitionTo\", function() {\n  var emptyState = loadedState.empty;\n\n  stateManager.transitionTo('loadedState.empty');\n\n  stateManager.transitionTo('');\n  ok(stateManager.get('currentState') === emptyState, \"transitionTo does nothing when given empty name\");\n\n  expectAssertion(function() {\n    stateManager.transitionTo('nonexistentState');\n  }, 'Could not find state for path: \"nonexistentState\"');\n\n  ok(stateManager.get('currentState') === emptyState, \"transitionTo does not infinite loop when given nonexistent State\");\n});\n\ntest(\"it automatically transitions to a default state\", function() {\n  stateManager = Ember.StateManager.create({\n    start: Ember.State.create({\n      isStart: true\n    })\n  });\n\n  ok(get(stateManager, 'currentState').isStart, \"automatically transitions to start state\");\n});\n\ntest(\"it automatically transitions to a default state that is an instance\", function() {\n  stateManager = Ember.StateManager.create({\n    states: {\n      foo: Ember.State.create({\n        start: Ember.State.extend({\n          isStart: true\n        })\n      })\n    }\n  });\n\n  stateManager.transitionTo('foo');\n  ok(get(stateManager, 'currentState').isStart, \"automatically transitions to start state\");\n});\n\ntest(\"on a state manager, it automatically transitions to a default state that is an instance\", function() {\n  stateManager = Ember.StateManager.create({\n    states: {\n      start: Ember.State.extend({\n        isStart: true\n      })\n    }\n  });\n\n  ok(get(stateManager, 'currentState').isStart, \"automatically transitions to start state\");\n});\n\ntest(\"it automatically transitions to a default state specified using the initialState property\", function() {\n  stateManager = Ember.StateManager.create({\n    initialState: 'beginning',\n\n    beginning: Ember.State.create({\n      isStart: true\n    })\n  });\n\n  ok(get(stateManager, 'currentState').isStart, \"automatically transitions to beginning state\");\n});\n\ntest(\"it automatically transitions to a default substate specified using the initialState property\", function() {\n  stateManager = Ember.StateManager.create({\n    start: Ember.State.create({\n      initialState: 'beginningSubstate',\n\n      beginningSubstate: Ember.State.create({\n        isStart: true\n      })\n    })\n  });\n\n  ok(get(stateManager, 'currentState').isStart, \"automatically transitions to beginning substate\");\n});\n\ntest(\"it automatically synchronously transitions into initialState in an event\", function() {\n  var count = 0;\n\n  stateManager = Ember.StateManager.create({\n    root: Ember.State.create({\n      original: Ember.State.create({\n        zomgAnEvent: function(manager) {\n          manager.transitionTo('nextState');\n          manager.send('zomgAnotherEvent');\n        }\n      }),\n\n      nextState: Ember.State.create({\n        initialState: 'begin',\n\n        begin: Ember.State.create({\n          zomgAnotherEvent: function(manager) {\n            count++;\n          }\n        })\n      })\n    })\n  });\n\n  Ember.run(function() {\n    stateManager.transitionTo('root.original');\n  });\n\n  Ember.run(function() {\n    stateManager.send('zomgAnEvent');\n    equal(count, 1, \"the initialState was synchronously effective\");\n  });\n});\n\ntest(\"it automatically transitions to multiple substates specified using either start or initialState property\", function() {\n  stateManager = Ember.StateManager.create({\n    start: Ember.State.create({\n      initialState: 'beginningSubstate',\n\n      beginningSubstate: Ember.State.create({\n        start: Ember.State.create({\n          initialState: 'finalSubstate',\n\n          finalSubstate: Ember.State.create({\n            isStart: true\n          })\n        })\n      })\n    })\n  });\n\n  ok(get(stateManager, 'currentState').isStart, \"automatically transitions to final substate\");\n});\n\ntest(\"it triggers setup on initialSubstate\", function() {\n  var parentSetup = false,\n      childSetup = false,\n      grandchildSetup = false;\n\n  stateManager = Ember.StateManager.create({\n    start: Ember.State.create({\n      setup: function() { parentSetup = true; },\n\n      initialState: 'childState',\n\n      childState: Ember.State.create({\n        setup: function() { childSetup = true; },\n\n        initialState: 'grandchildState',\n\n        grandchildState: Ember.State.create({\n          setup: function() { grandchildSetup = true; }\n        })\n      })\n    })\n  });\n\n  ok(parentSetup, \"sets up parent\");\n  ok(childSetup, \"sets up child\");\n  ok(grandchildSetup, \"sets up grandchild\");\n});\n\ntest(\"it throws an assertion error when the initialState does not exist\", function() {\n  expectAssertion(function() {\n    Ember.StateManager.create({\n      initialState: 'foo',\n      bar: Ember.State.create()\n    });\n  });\n});\n\nmodule(\"Ember.StateManager - Transitions on Complex State Managers\");\n\n/**\n            SM\n          /    \\\n     Login      Redeem\n    /    |        |    \\\n  Start  Pending Start  Pending\n\n  * Transition from Login.Start to Redeem\n    - Login.Start and Login should receive exit events\n    - Redeem should receiver enter event\n*/\n\ntest(\"it sends exit events to nested states when changing to a top-level state\", function() {\n  var stateManager = Ember.StateManager.create({\n    login: Ember.State.create(stateEventStub, {\n      start: Ember.State.create(stateEventStub),\n      pending: Ember.State.create(stateEventStub)\n    }),\n\n    redeem: Ember.State.create(stateEventStub, {\n      isRedeem: true,\n      start: Ember.State.create(),\n      pending: Ember.State.create()\n    })\n  });\n\n  stateManager.transitionTo('login');\n  equal(stateManager.login.entered, 1, \"precond - it enters the login state\");\n  equal(stateManager.login.start.entered, 1, \"automatically enters the start state\");\n  ok(stateManager.get('currentState') === stateManager.login.start, \"automatically sets currentState to start state\");\n\n  stateManager.login.reset();\n  stateManager.login.start.reset();\n\n  stateManager.transitionTo('redeem');\n\n  equal(stateManager.login.exited, 1, \"login state is exited once\");\n  equal(stateManager.login.start.exited, 1, \"start state is exited once\");\n\n  equal(stateManager.redeem.entered, 1, \"redeemed state is entered once\");\n});\n\ntest(\"it sends exit events in the correct order when changing to a top-level state\", function() {\n  var exitOrder = [],\n      stateManager = Ember.StateManager.create({\n        start: Ember.State.create({\n          outer: Ember.State.create({\n            inner: Ember.State.create({\n              exit: function() { exitOrder.push('exitedInner'); }\n            }),\n            exit: function() { exitOrder.push('exitedOuter'); }\n          })\n        })\n      });\n\n  stateManager.transitionTo('start.outer.inner');\n  stateManager.transitionTo('start');\n  equal(exitOrder.length, 2, \"precond - it calls both exits\");\n  equal(exitOrder[0], 'exitedInner', \"inner exit is called first\");\n  equal(exitOrder[1], 'exitedOuter', \"outer exit is called second\");\n});\n\ntest(\"it sends exit events in the correct order when changing to a state multiple times\", function() {\n  var exitOrder = [],\n      stateManager = Ember.StateManager.create({\n        start: Ember.State.create({\n          outer: Ember.State.create({\n            inner: Ember.State.create({\n              exit: function() { exitOrder.push('exitedInner'); }\n            }),\n            exit: function() { exitOrder.push('exitedOuter'); }\n          })\n        })\n      });\n\n  stateManager.transitionTo('start.outer.inner');\n  stateManager.transitionTo('start');\n  stateManager.transitionTo('start.outer.inner');\n  exitOrder = [];\n  stateManager.transitionTo('start');\n  equal(exitOrder.length, 2, \"precond - it calls both exits\");\n  equal(exitOrder[0], 'exitedInner', \"inner exit is called first\");\n  equal(exitOrder[1], 'exitedOuter', \"outer exit is called second\");\n});\n\nvar passedContext, passedContexts, loadingEventCalled, loadedEventCalled, eventInChildCalled;\nloadingEventCalled = loadedEventCalled = eventInChildCalled = 0;\n\nmodule(\"Ember.StateManager - Event Dispatching\", {\n  setup: function() {\n    stateManager = Ember.StateManager.create({\n      loading: Ember.State.create({\n        anEvent: function(manager, context) {\n          loadingEventCalled++;\n          passedContext = context;\n          passedContexts = [].slice.call(arguments, 1);\n        }\n      }),\n\n      loaded: Ember.State.create({\n        anEvent: function() {\n          loadedEventCalled++;\n        },\n\n        eventInChild: function() {\n          eventInChildCalled++;\n        },\n\n        empty: Ember.State.create({\n          eventInChild: function() {\n            eventInChildCalled++;\n          }\n        })\n      })\n    });\n\n    stateManager.transitionTo('loading');\n  }\n});\n\ntest(\"it dispatches events to the current state\", function() {\n  stateManager.send('anEvent');\n\n  equal(loadingEventCalled, 1, \"event was triggered\");\n});\n\ntest(\"it dispatches events to a parent state if the child state does not respond to it\", function() {\n  stateManager.transitionTo('loaded.empty');\n  stateManager.send('anEvent');\n\n  equal(loadedEventCalled, 1, \"parent state receives event\");\n});\n\ntest(\"it does not dispatch events to parents if the child responds to it\", function() {\n  stateManager.transitionTo('loaded.empty');\n  stateManager.send('eventInChild');\n\n  equal(eventInChildCalled, 1, \"does not dispatch event to parent\");\n});\n\ntest(\"it supports arguments to events\", function() {\n  stateManager.send('anEvent', { context: true });\n  equal(passedContext.context, true, \"send passes along a context\");\n});\n\ntest(\"it supports multiple arguments to events\", function() {\n  stateManager.send('anEvent', {name: 'bestie'}, {name: 'crofty'});\n  equal(passedContexts[0].name, 'bestie', \"send passes along the first context\");\n  equal(passedContexts[1].name, 'crofty', \"send passes along the second context\");\n});\n\ntest(\"it throws an exception if an event is dispatched that is unhandled\", function() {\n  raises(function() {\n    stateManager.send('unhandledEvent');\n  }, Error, \"exception was raised\");\n\n  stateManager = Ember.StateManager.create({\n    initialState: 'loading',\n    errorOnUnhandledEvent: false,\n    loading: Ember.State.create({\n      anEvent: function() {}\n    })\n  });\n\n  stateManager.send('unhandledEvent');\n  ok(true, \"does not raise exception when errorOnUnhandledEvent is set to false\");\n});\n\ntest(\"it looks for unhandledEvent handler in the currentState if event is not handled by named handler\", function() {\n  var wasCalled = 0,\n      evt = \"foo\",\n      calledWithOriginalEventName,\n      calledWithEvent;\n  stateManager = Ember.StateManager.create({\n    initialState: 'loading',\n    loading: Ember.State.create({\n      unhandledEvent: function(manager, originalEventName, event) {\n        wasCalled = true;\n        calledWithOriginalEventName = originalEventName;\n        calledWithEvent = event;\n      }\n    })\n  });\n  stateManager.send(\"somethingUnhandled\", evt);\n  ok(wasCalled);\n  equal(calledWithOriginalEventName, 'somethingUnhandled');\n  equal(calledWithEvent, evt);\n});\n\ntest(\"it looks for unhandledEvent handler in the stateManager if event is not handled by named handler\", function() {\n  var wasCalled = 0,\n      evt = \"foo\",\n      calledWithOriginalEventName,\n      calledWithEvent;\n  stateManager = Ember.StateManager.create({\n    initialState: 'loading',\n    unhandledEvent: function(manager, originalEventName, event) {\n      wasCalled = true;\n      calledWithOriginalEventName = originalEventName;\n      calledWithEvent = event;\n    },\n    loading: Ember.State.create({})\n  });\n  stateManager.send(\"somethingUnhandled\", evt);\n  ok(wasCalled);\n  equal(calledWithOriginalEventName, 'somethingUnhandled');\n  equal(calledWithEvent, evt);\n});\n\nmodule(\"Ember.Statemanager - Pivot states\", {\n  setup: function() {\n    var State = Ember.State.extend(stateEventStub);\n\n    stateManager = Ember.StateManager.create(stateEventStub, {\n      grandparent: State.create({\n        parent: State.create({\n          child: State.create(),\n          sibling: State.create()\n        }),\n        cousin: State.create()\n      })\n    });\n  }\n});\n\ntest(\"transitionTo triggers all enter states\", function() {\n  stateManager.transitionTo('grandparent.parent.child');\n  equal(stateManager.grandparent.entered, 1, \"the top level should be entered\");\n  equal(stateManager.grandparent.parent.entered, 1, \"intermediate states should be entered\");\n  equal(stateManager.grandparent.parent.child.entered, 1, \"the final state should be entered\");\n\n  stateManager.transitionTo('grandparent.parent.sibling');\n  equal(stateManager.grandparent.entered, 1, \"the top level should not be re-entered\");\n  equal(stateManager.grandparent.parent.entered, 1, \"intermediate states should not be re-entered\");\n  equal(stateManager.grandparent.parent.child.entered, 1, \"the final state should not be re-entered\");\n\n  equal(stateManager.grandparent.parent.child.exited, 1, \"the child should have exited\");\n  equal(stateManager.grandparent.exited, 0, \"the top level should not have have exited\");\n  equal(stateManager.grandparent.parent.exited, 0, \"intermediate states should not have exited\");\n});\n\ntest(\"transitionTo with current state does not trigger enter or exit\", function() {\n  stateManager.transitionTo('grandparent.parent.child');\n  stateManager.transitionTo('grandparent.parent.child');\n  equal(stateManager.grandparent.entered, 1, \"the top level should only be entered once\");\n  equal(stateManager.grandparent.parent.entered, 1, \"intermediate states should only be entered once\");\n  equal(stateManager.grandparent.parent.child.entered, 1, \"the final state should only be entered once\");\n  equal(stateManager.grandparent.parent.child.exited, 0, \"the final state should not be exited\");\n});\n\nmodule(\"Transition contexts\");\n\ntest(\"if a context is passed to a transition, the state's setup event is triggered after the transition has completed\", function() {\n  expect(1);\n  var context = {};\n\n  Ember.run(function() {\n    stateManager = Ember.StateManager.create({\n      start: Ember.State.create({\n        goNext: function(manager, context) {\n          manager.transitionTo('next', context);\n        }\n      }),\n\n      next: Ember.State.create({\n        setup: function(manager, passedContext) {\n          equal(context, passedContext, \"The context is passed through\");\n        }\n      })\n    });\n  });\n\n  stateManager.send('goNext', context);\n});\n\ntest(\"if a context is passed to a transition and the path is to the current state, the state's setup event is triggered again\", function() {\n  expect(2);\n  var counter = 0;\n\n  Ember.run(function() {\n    stateManager = Ember.StateManager.create({\n      start: Ember.State.create({\n        goNext: function(manager, context) {\n          counter++;\n          manager.transitionTo('foo.next', counter);\n        }\n      }),\n\n      foo: Ember.State.create({\n        next: Ember.State.create({\n          goNext: function(manager, context) {\n            counter++;\n            manager.transitionTo('next', counter);\n          },\n\n          setup: function(manager, context) {\n            equal(context, counter, \"The context is passed through\");\n          }\n        })\n      })\n    });\n  });\n\n  stateManager.send('goNext', counter);\n  stateManager.send('goNext', counter);\n});\n\ntest(\"if no context is provided, setup is triggered with an undefined context\", function() {\n  expect(1);\n\n  Ember.run(function() {\n    stateManager = Ember.StateManager.create({\n      start: Ember.State.create({\n        goNext: function(manager) {\n          manager.transitionTo('next');\n        },\n\n        next: Ember.State.create({\n          setup: function(manager, context) {\n            equal(context, undefined, \"setup is called with no context\");\n          }\n        })\n      })\n    });\n  });\n\n  stateManager.send('goNext');\n});\n\ntest(\"multiple contexts can be provided in a single transitionTo\", function() {\n  expect(2);\n\n  Ember.run(function() {\n    stateManager = Ember.StateManager.create({\n      start: Ember.State.create(),\n\n      planters: Ember.State.create({\n        setup: function(manager, context) {\n          deepEqual(context, { company: true });\n        },\n\n        nuts: Ember.State.create({\n          setup: function(manager, context) {\n            deepEqual(context, { product: true });\n          }\n        })\n      })\n    });\n  });\n\n  stateManager.transitionTo('planters.nuts', { company: true }, { product: true });\n});\n\ntest(\"multiple contexts only apply to states that need them\", function() {\n  expect(4);\n\n  Ember.run(function() {\n    stateManager = Ember.StateManager.create({\n      start: Ember.State.create(),\n\n      parent: Ember.State.create({\n        hasContext: false,\n\n        setup: function(manager, context) {\n          equal(context, undefined);\n        },\n\n        child: Ember.State.create({\n          setup: function(manager, context) {\n            equal(context, 'one');\n          },\n\n          grandchild: Ember.State.create({\n            initialState: 'greatGrandchild',\n\n            setup: function(manager, context) {\n              equal(context, 'two');\n            },\n\n            greatGrandchild: Ember.State.create({\n              setup: function(manager, context) {\n                equal(context, undefined);\n              }\n            })\n          })\n        })\n      })\n    });\n  });\n\n  stateManager.transitionTo('parent.child.grandchild', 'one', 'two');\n});\n\ntest(\"transitionEvent is called for each nested state\", function() {\n  expect(4);\n\n  var calledOnParent = false,\n      calledOnChild = true;\n\n  Ember.run(function() {\n    stateManager = Ember.StateManager.create({\n      start: Ember.State.create(),\n\n      planters: Ember.State.create({\n        setup: function(manager, context) {\n          calledOnParent = true;\n        },\n\n        nuts: Ember.State.create({\n          setup: function(manager, context) {\n            calledOnChild = true;\n          }\n        })\n      })\n    });\n  });\n\n  stateManager.transitionTo('planters.nuts');\n\n  ok(calledOnParent, 'called transitionEvent on parent');\n  ok(calledOnChild, 'called transitionEvent on child');\n\n  // repeat the test now that the path is cached\n\n  stateManager.transitionTo('start');\n\n  calledOnParent = false;\n  calledOnChild = false;\n\n  stateManager.transitionTo('planters.nuts');\n\n  ok(calledOnParent, 'called transitionEvent on parent');\n  ok(calledOnChild, 'called transitionEvent on child');\n});\n\ntest(\"transitionEvent is called for each nested state with context\", function() {\n  expect(8);\n\n  var calledOnParent = false,\n      calledOnChild = true;\n\n  Ember.run(function() {\n    stateManager = Ember.StateManager.create({\n      start: Ember.State.create(),\n\n      planters: Ember.State.create({\n        setup: function(manager, context) {\n          calledOnParent = true;\n          ok(!context, 'single context is not called on parent');\n        },\n\n        nuts: Ember.State.create({\n          setup: function(manager, context) {\n            calledOnChild = true;\n            equal(context, 'context', 'child gets context');\n          }\n        })\n      })\n    });\n  });\n\n  stateManager.transitionTo('planters.nuts', 'context');\n\n  ok(calledOnParent, 'called transitionEvent on parent');\n  ok(calledOnChild, 'called transitionEvent on child');\n\n  // repeat the test now that the path is cached\n\n  stateManager.transitionTo('start');\n\n  calledOnParent = false;\n  calledOnChild = false;\n\n  stateManager.transitionTo('planters.nuts', 'context');\n\n  ok(calledOnParent, 'called transitionEvent on parent');\n  ok(calledOnChild, 'called transitionEvent on child');\n});\n\ntest(\"nothing happens if transitioning to a parent state when the current state is also the initial state\", function() {\n  var calledOnParent = 0,\n      calledOnChild = 0;\n\n  Ember.run(function() {\n    stateManager = Ember.StateManager.create({\n      start: Ember.State.create({\n        initialState: 'first',\n\n        setup: function() {\n          calledOnParent++;\n        },\n\n        first: Ember.State.create({\n          setup: function() {\n            calledOnChild++;\n          }\n        })\n      })\n    });\n  });\n\n  equal(calledOnParent, 1, 'precond - setup parent');\n  equal(calledOnChild, 1, 'precond - setup child');\n  equal(stateManager.get('currentState.path'), 'start.first', 'precond - is in expected state');\n\n  stateManager.transitionTo('start');\n\n  equal(calledOnParent, 1, 'does not transition to parent again');\n  equal(calledOnChild, 1, 'does not transition to child again');\n  equal(stateManager.get('currentState.path'), 'start.first', 'does not change state');\n\n});\n\ntest(\"StateManagers can use `create`d states from mixins\", function() {\n  var statesMixin,\n    firstManagerClass, secondManagerClass,\n    firstManager, secondManager,\n    firstCount = 0, secondCount = 0;\n\n  statesMixin = Ember.Mixin.create({\n    initialState: 'ready',\n    ready: Ember.State.create({\n      startUpload: function(manager) {\n        manager.transitionTo('uploading');\n      }\n    })\n  });\n\n  firstManagerClass = Ember.StateManager.extend(statesMixin, {\n    uploading: Ember.State.create({\n      enter: function() { firstCount++; }\n    })\n  });\n\n  secondManagerClass = Ember.StateManager.extend(statesMixin, {\n    uploading: Ember.State.create({\n      enter: function() { secondCount++; }\n    })\n  });\n\n  firstManager  = firstManagerClass.create();\n  firstManager.send('startUpload');\n\n  secondManager = secondManagerClass.create();\n  secondManager.send('startUpload');\n\n  equal(firstCount, 1, \"The first state manager's uploading state was entered once\");\n  equal(secondCount, 1, \"The second state manager's uploading state was entered once\");\n});\n\n\n})();\n//@ sourceURL=ember-states/~tests/state_manager_test");minispade.register('ember-states/~tests/state_test', "(function() {var get = Ember.get, set = Ember.set, _$;\n\nmodule(\"Ember.State\");\n\ntest(\"exists\", function() {\n  ok(Ember.Object.detect(Ember.State), \"Ember.State is an Ember.Object\");\n});\n\ntest(\"creating a state with substates sets the parentState property\", function() {\n  var state = Ember.State.create({\n    child: Ember.State.create()\n  });\n\n  equal(state.get('child.parentState'), state, \"A child state gets its parent state\");\n  deepEqual(state.get('childStates'), [ state.get('child') ], \"The childStates method returns a state's child states\");\n});\n\ntest(\"a state is passed its state manager when receiving an enter event\", function() {\n  expect(2);\n\n  var count = 0;\n\n  var states = {\n    load: Ember.State.create({\n      enter: function(passedStateManager) {\n        if (count === 0) {\n          ok(passedStateManager.get('isFirst'), \"passes first state manager when created\");\n        } else {\n          ok(passedStateManager.get('isSecond'), \"passes second state manager when created\");\n        }\n\n        count++;\n      }\n    })\n  };\n\n  var stateManager = Ember.StateManager.create({\n    initialState: 'load',\n    isFirst: true,\n\n    states: states\n  });\n\n  var anotherStateManager = Ember.StateManager.create({\n    initialState: 'load',\n    isSecond: true,\n\n    states: states\n  });\n});\n\ntest(\"a state can have listeners that are fired when the state is entered\", function() {\n  expect(2);\n\n  var count = 0;\n\n  var states = {\n    load: Ember.State.create()\n  };\n\n  states.load.on('enter', function(passedStateManager) {\n    if (count === 0) {\n      ok(passedStateManager.get('isFirst'), \"passes first state manager when created\");\n    } else {\n      ok(passedStateManager.get('isSecond'), \"passes second state manager when created\");\n    }\n\n    count++;\n  });\n\n  var stateManager = Ember.StateManager.create({\n    initialState: 'load',\n    isFirst: true,\n\n    states: states\n  });\n\n  var anotherStateManager = Ember.StateManager.create({\n    initialState: 'load',\n    isSecond: true,\n\n    states: states\n  });\n});\n\ntest(\"a state finds properties that are states and copies them to the states hash\", function() {\n  var state1 = Ember.State.create();\n  var state2 = Ember.State.create();\n\n  var superClass = Ember.State.extend({\n    state1: state1\n  });\n\n  var stateInstance = superClass.create({\n    state2: state2\n  });\n\n  var states = get(stateInstance, 'states');\n\n  deepEqual(states, { state1: state1, state2: state2 }, \"states should be retrieved from both the instance and its class\");\n});\n\ntest(\"a state finds properties that are state classes and instantiates them\", function() {\n  var state1 = Ember.State.extend({\n    isState1: true\n  });\n  var state2 = Ember.State.extend({\n    isState2: true\n  });\n\n  var superClass = Ember.State.extend({\n    state1: state1\n  });\n\n  var stateInstance = superClass.create({\n    state2: state2\n  });\n\n  var states = get(stateInstance, 'states');\n\n  equal(get(states.state1, 'isState1'), true, \"instantiated first state\");\n  equal(get(states.state2, 'isState2'), true, \"instantiated second state\");\n});\n\ntest(\"states set up proper names on their children\", function() {\n  var manager = Ember.StateManager.create({\n    states: {\n      first: Ember.State.extend({\n        insideFirst: Ember.State.extend({\n\n        })\n      })\n    }\n  });\n\n  manager.transitionTo('first');\n  equal(get(manager, 'currentState.path'), 'first');\n\n  manager.transitionTo('first.insideFirst');\n  equal(get(manager, 'currentState.path'), 'first.insideFirst');\n});\n\ntest(\"states with child instances set up proper names on their children\", function() {\n  var manager = Ember.StateManager.create({\n    states: {\n      first: Ember.State.create({\n        insideFirst: Ember.State.create({\n\n        })\n      })\n    }\n  });\n\n  manager.transitionTo('first');\n  equal(get(manager, 'currentState.path'), 'first');\n\n  manager.transitionTo('first.insideFirst');\n  equal(get(manager, 'currentState.path'), 'first.insideFirst');\n});\n\ntest(\"the isLeaf property is false when a state has child states\", function() {\n  var manager = Ember.StateManager.create({\n    states: {\n      first: Ember.State.create({\n        insideFirst: Ember.State.create(),\n        otherInsideFirst: Ember.State.create({\n          definitelyInside: Ember.State.create()\n        })\n      })\n    }\n  });\n\n  var first = manager.get('states.first');\n  var insideFirst = first.get('states.insideFirst');\n  var otherInsideFirst = first.get('states.otherInsideFirst');\n  var definitelyInside = otherInsideFirst.get('states.definitelyInside');\n\n  equal(first.get('isLeaf'), false);\n  equal(insideFirst.get('isLeaf'), true);\n  equal(otherInsideFirst.get('isLeaf'), false);\n  equal(definitelyInside.get('isLeaf'), true);\n});\n\ntest(\"propagates its container to its child states\", function() {\n  var container = { lookup: Ember.K },\n      manager = Ember.StateManager.create({\n        container: container,\n        states: {\n          first: Ember.State.extend({\n            insideFirst: Ember.State.extend()\n          }),\n          second: Ember.State.create()\n        }\n      });\n\n  var first = manager.get('states.first'),\n      insideFirst = first.get('states.insideFirst'),\n      second = manager.get('states.second');\n\n  equal(first.container, container, 'container should be given to a `create`ed child state');\n  equal(insideFirst.container, container, 'container should be given to a nested child state');\n  equal(second.container, container, 'container should be given to a `extend`ed child state after creation');\n});\n\nmodule(\"Ember.State.transitionTo\", {\n  setup: function() {\n    _$ = Ember.$;\n    Ember.$ = {};\n    Ember.$.Event = function() {};\n  },\n  teardown: function() {\n    Ember.$ = _$;\n  }\n});\ntest(\"sets the transition target\", function() {\n  var receivedTarget,\n      receivedContext,\n      stateManager,\n      transitionFunction;\n\n  stateManager = {\n    transitionTo: function(target, context) {\n      receivedTarget = target;\n      receivedContext = context;\n    }\n  };\n\n  transitionFunction = Ember.State.transitionTo('targetState');\n\n  transitionFunction(stateManager, new Ember.$.Event());\n\n  equal(receivedTarget, 'targetState');\n  ok(!receivedContext, \"does not pass a context when given an event without context\");\n});\n\ntest(\"passes no context arguments when there are no contexts\", function() {\n  var contextArgsCount,\n      stateManager,\n      transitionFunction,\n      event;\n\n  event = new Ember.$.Event();\n  event.contexts = [];\n\n  stateManager = {\n    transitionTo: function() {\n      contextArgsCount = [].slice.call(arguments, 1).length;\n    }\n  };\n\n  transitionFunction = Ember.State.transitionTo('targetState');\n\n  transitionFunction(stateManager, event);\n\n  equal( contextArgsCount, 0);\n});\n\ntest(\"passes through a single context\", function() {\n  var receivedContext,\n      stateManager,\n      transitionFunction,\n      event;\n\n  event = new Ember.$.Event();\n  event.contexts = [{ value: 'context value' }];\n\n  stateManager = {\n    transitionTo: function(target, context) {\n      receivedContext = context;\n    }\n  };\n\n  transitionFunction = Ember.State.transitionTo('targetState');\n\n  transitionFunction(stateManager, event);\n\n  equal( receivedContext, event.contexts[0]);\n});\n\ntest(\"passes through multiple contexts as additional arguments\", function() {\n  var receivedContexts,\n      stateManager,\n      transitionFunction,\n      event;\n\n  event = new Ember.$.Event();\n  event.contexts = [ { value: 'context1' }, { value: 'context2' } ];\n\n  stateManager = {\n    transitionTo: function(target) {\n      receivedContexts = [].slice.call(arguments, 1);\n    }\n  };\n\n  transitionFunction = Ember.State.transitionTo('targetState');\n\n  transitionFunction(stateManager, event);\n\n  deepEqual( receivedContexts, event.contexts);\n});\n\ntest(\"does not mutate the event contexts value\", function() {\n  var receivedContexts,\n      stateManager,\n      transitionFunction,\n      originalContext,\n      event;\n\n  originalContext = [ { value: 'context1' }, { value: 'context2' } ];\n\n  event = new Ember.$.Event();\n  event.contexts = originalContext.slice();\n\n  stateManager = {\n    transitionTo: function(target) {\n      receivedContexts = [].slice.call(arguments, 1);\n    }\n  };\n\n  transitionFunction = Ember.State.transitionTo('targetState');\n\n  transitionFunction(stateManager, event);\n\n  deepEqual(event.contexts, originalContext);\n});\n\ntest(\"passes no context arguments when called with no context or event\", function() {\n  var receivedContexts,\n      stateManager,\n      transitionFunction;\n\n  stateManager = {\n    transitionTo: function(target) {\n      receivedContexts = [].slice.call(arguments, 1);\n    }\n  };\n\n  transitionFunction = Ember.State.transitionTo('targetState');\n\n  transitionFunction(stateManager);\n\n  equal( receivedContexts.length, 0, \"transitionTo receives no context\");\n});\n\ntest(\"handles contexts without an event\", function() {\n  var receivedContexts,\n      stateManager,\n      transitionFunction,\n      context1,\n      context2;\n\n  context1 = { value: 'context1', contexts: 'I am not an event'};\n  context2 = { value: 'context2', contexts: ''};\n\n  stateManager = {\n    transitionTo: function(target) {\n      receivedContexts = [].slice.call(arguments, 1);\n    }\n  };\n\n  transitionFunction = Ember.State.transitionTo('targetState');\n\n  transitionFunction(stateManager, context1, context2);\n\n  equal( receivedContexts[0], context1, \"the first context is passed through\" );\n  equal( receivedContexts[1], context2, \"the second context is passed through\" );\n});\n\n})();\n//@ sourceURL=ember-states/~tests/state_test");