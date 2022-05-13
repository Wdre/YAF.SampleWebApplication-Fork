(function(global, factory) {
    typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, 
    global.bootstrap = factory());
})(this, function() {
    "use strict";
    const MAX_UID = 1e6;
    const MILLISECONDS_MULTIPLIER = 1e3;
    const TRANSITION_END = "transitionend";
    const toType = obj => {
        if (obj === null || obj === undefined) {
            return `${obj}`;
        }
        return {}.toString.call(obj).match(/\s([a-z]+)/i)[1].toLowerCase();
    };
    const getUID = prefix => {
        do {
            prefix += Math.floor(Math.random() * MAX_UID);
        } while (document.getElementById(prefix));
        return prefix;
    };
    const getSelector = element => {
        let selector = element.getAttribute("data-bs-target");
        if (!selector || selector === "#") {
            let hrefAttr = element.getAttribute("href");
            if (!hrefAttr || !hrefAttr.includes("#") && !hrefAttr.startsWith(".")) {
                return null;
            }
            if (hrefAttr.includes("#") && !hrefAttr.startsWith("#")) {
                hrefAttr = `#${hrefAttr.split("#")[1]}`;
            }
            selector = hrefAttr && hrefAttr !== "#" ? hrefAttr.trim() : null;
        }
        return selector;
    };
    const getSelectorFromElement = element => {
        const selector = getSelector(element);
        if (selector) {
            return document.querySelector(selector) ? selector : null;
        }
        return null;
    };
    const getElementFromSelector = element => {
        const selector = getSelector(element);
        return selector ? document.querySelector(selector) : null;
    };
    const getTransitionDurationFromElement = element => {
        if (!element) {
            return 0;
        }
        let {
            transitionDuration,
            transitionDelay
        } = window.getComputedStyle(element);
        const floatTransitionDuration = Number.parseFloat(transitionDuration);
        const floatTransitionDelay = Number.parseFloat(transitionDelay);
        if (!floatTransitionDuration && !floatTransitionDelay) {
            return 0;
        }
        transitionDuration = transitionDuration.split(",")[0];
        transitionDelay = transitionDelay.split(",")[0];
        return (Number.parseFloat(transitionDuration) + Number.parseFloat(transitionDelay)) * MILLISECONDS_MULTIPLIER;
    };
    const triggerTransitionEnd = element => {
        element.dispatchEvent(new Event(TRANSITION_END));
    };
    const isElement$1 = obj => {
        if (!obj || typeof obj !== "object") {
            return false;
        }
        if (typeof obj.jquery !== "undefined") {
            obj = obj[0];
        }
        return typeof obj.nodeType !== "undefined";
    };
    const getElement = obj => {
        if (isElement$1(obj)) {
            return obj.jquery ? obj[0] : obj;
        }
        if (typeof obj === "string" && obj.length > 0) {
            return document.querySelector(obj);
        }
        return null;
    };
    const typeCheckConfig = (componentName, config, configTypes) => {
        Object.keys(configTypes).forEach(property => {
            const expectedTypes = configTypes[property];
            const value = config[property];
            const valueType = value && isElement$1(value) ? "element" : toType(value);
            if (!new RegExp(expectedTypes).test(valueType)) {
                throw new TypeError(`${componentName.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`);
            }
        });
    };
    const isVisible = element => {
        if (!isElement$1(element) || element.getClientRects().length === 0) {
            return false;
        }
        return getComputedStyle(element).getPropertyValue("visibility") === "visible";
    };
    const isDisabled = element => {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return true;
        }
        if (element.classList.contains("disabled")) {
            return true;
        }
        if (typeof element.disabled !== "undefined") {
            return element.disabled;
        }
        return element.hasAttribute("disabled") && element.getAttribute("disabled") !== "false";
    };
    const findShadowRoot = element => {
        if (!document.documentElement.attachShadow) {
            return null;
        }
        if (typeof element.getRootNode === "function") {
            const root = element.getRootNode();
            return root instanceof ShadowRoot ? root : null;
        }
        if (element instanceof ShadowRoot) {
            return element;
        }
        if (!element.parentNode) {
            return null;
        }
        return findShadowRoot(element.parentNode);
    };
    const noop = () => {};
    const reflow = element => {
        element.offsetHeight;
    };
    const getjQuery = () => {
        const {
            jQuery
        } = window;
        if (jQuery && !document.body.hasAttribute("data-bs-no-jquery")) {
            return jQuery;
        }
        return null;
    };
    const DOMContentLoadedCallbacks = [];
    const onDOMContentLoaded = callback => {
        if (document.readyState === "loading") {
            if (!DOMContentLoadedCallbacks.length) {
                document.addEventListener("DOMContentLoaded", () => {
                    DOMContentLoadedCallbacks.forEach(callback => callback());
                });
            }
            DOMContentLoadedCallbacks.push(callback);
        } else {
            callback();
        }
    };
    const isRTL = () => document.documentElement.dir === "rtl";
    const defineJQueryPlugin = plugin => {
        onDOMContentLoaded(() => {
            const $ = getjQuery();
            if ($) {
                const name = plugin.NAME;
                const JQUERY_NO_CONFLICT = $.fn[name];
                $.fn[name] = plugin.jQueryInterface;
                $.fn[name].Constructor = plugin;
                $.fn[name].noConflict = () => {
                    $.fn[name] = JQUERY_NO_CONFLICT;
                    return plugin.jQueryInterface;
                };
            }
        });
    };
    const execute = callback => {
        if (typeof callback === "function") {
            callback();
        }
    };
    const executeAfterTransition = (callback, transitionElement, waitForTransition = true) => {
        if (!waitForTransition) {
            execute(callback);
            return;
        }
        const durationPadding = 5;
        const emulatedDuration = getTransitionDurationFromElement(transitionElement) + durationPadding;
        let called = false;
        const handler = ({
            target
        }) => {
            if (target !== transitionElement) {
                return;
            }
            called = true;
            transitionElement.removeEventListener(TRANSITION_END, handler);
            execute(callback);
        };
        transitionElement.addEventListener(TRANSITION_END, handler);
        setTimeout(() => {
            if (!called) {
                triggerTransitionEnd(transitionElement);
            }
        }, emulatedDuration);
    };
    const getNextActiveElement = (list, activeElement, shouldGetNext, isCycleAllowed) => {
        let index = list.indexOf(activeElement);
        if (index === -1) {
            return list[!shouldGetNext && isCycleAllowed ? list.length - 1 : 0];
        }
        const listLength = list.length;
        index += shouldGetNext ? 1 : -1;
        if (isCycleAllowed) {
            index = (index + listLength) % listLength;
        }
        return list[Math.max(0, Math.min(index, listLength - 1))];
    };
    const namespaceRegex = /[^.]*(?=\..*)\.|.*/;
    const stripNameRegex = /\..*/;
    const stripUidRegex = /::\d+$/;
    const eventRegistry = {};
    let uidEvent = 1;
    const customEvents = {
        mouseenter: "mouseover",
        mouseleave: "mouseout"
    };
    const customEventsRegex = /^(mouseenter|mouseleave)/i;
    const nativeEvents = new Set([ "click", "dblclick", "mouseup", "mousedown", "contextmenu", "mousewheel", "DOMMouseScroll", "mouseover", "mouseout", "mousemove", "selectstart", "selectend", "keydown", "keypress", "keyup", "orientationchange", "touchstart", "touchmove", "touchend", "touchcancel", "pointerdown", "pointermove", "pointerup", "pointerleave", "pointercancel", "gesturestart", "gesturechange", "gestureend", "focus", "blur", "change", "reset", "select", "submit", "focusin", "focusout", "load", "unload", "beforeunload", "resize", "move", "DOMContentLoaded", "readystatechange", "error", "abort", "scroll" ]);
    function getUidEvent(element, uid) {
        return uid && `${uid}::${uidEvent++}` || element.uidEvent || uidEvent++;
    }
    function getEvent(element) {
        const uid = getUidEvent(element);
        element.uidEvent = uid;
        eventRegistry[uid] = eventRegistry[uid] || {};
        return eventRegistry[uid];
    }
    function bootstrapHandler(element, fn) {
        return function handler(event) {
            event.delegateTarget = element;
            if (handler.oneOff) {
                EventHandler.off(element, event.type, fn);
            }
            return fn.apply(element, [ event ]);
        };
    }
    function bootstrapDelegationHandler(element, selector, fn) {
        return function handler(event) {
            const domElements = element.querySelectorAll(selector);
            for (let {
                target
            } = event; target && target !== this; target = target.parentNode) {
                for (let i = domElements.length; i--; ) {
                    if (domElements[i] === target) {
                        event.delegateTarget = target;
                        if (handler.oneOff) {
                            EventHandler.off(element, event.type, selector, fn);
                        }
                        return fn.apply(target, [ event ]);
                    }
                }
            }
            return null;
        };
    }
    function findHandler(events, handler, delegationSelector = null) {
        const uidEventList = Object.keys(events);
        for (let i = 0, len = uidEventList.length; i < len; i++) {
            const event = events[uidEventList[i]];
            if (event.originalHandler === handler && event.delegationSelector === delegationSelector) {
                return event;
            }
        }
        return null;
    }
    function normalizeParams(originalTypeEvent, handler, delegationFn) {
        const delegation = typeof handler === "string";
        const originalHandler = delegation ? delegationFn : handler;
        let typeEvent = getTypeEvent(originalTypeEvent);
        const isNative = nativeEvents.has(typeEvent);
        if (!isNative) {
            typeEvent = originalTypeEvent;
        }
        return [ delegation, originalHandler, typeEvent ];
    }
    function addHandler(element, originalTypeEvent, handler, delegationFn, oneOff) {
        if (typeof originalTypeEvent !== "string" || !element) {
            return;
        }
        if (!handler) {
            handler = delegationFn;
            delegationFn = null;
        }
        if (customEventsRegex.test(originalTypeEvent)) {
            const wrapFn = fn => {
                return function(event) {
                    if (!event.relatedTarget || event.relatedTarget !== event.delegateTarget && !event.delegateTarget.contains(event.relatedTarget)) {
                        return fn.call(this, event);
                    }
                };
            };
            if (delegationFn) {
                delegationFn = wrapFn(delegationFn);
            } else {
                handler = wrapFn(handler);
            }
        }
        const [ delegation, originalHandler, typeEvent ] = normalizeParams(originalTypeEvent, handler, delegationFn);
        const events = getEvent(element);
        const handlers = events[typeEvent] || (events[typeEvent] = {});
        const previousFn = findHandler(handlers, originalHandler, delegation ? handler : null);
        if (previousFn) {
            previousFn.oneOff = previousFn.oneOff && oneOff;
            return;
        }
        const uid = getUidEvent(originalHandler, originalTypeEvent.replace(namespaceRegex, ""));
        const fn = delegation ? bootstrapDelegationHandler(element, handler, delegationFn) : bootstrapHandler(element, handler);
        fn.delegationSelector = delegation ? handler : null;
        fn.originalHandler = originalHandler;
        fn.oneOff = oneOff;
        fn.uidEvent = uid;
        handlers[uid] = fn;
        element.addEventListener(typeEvent, fn, delegation);
    }
    function removeHandler(element, events, typeEvent, handler, delegationSelector) {
        const fn = findHandler(events[typeEvent], handler, delegationSelector);
        if (!fn) {
            return;
        }
        element.removeEventListener(typeEvent, fn, Boolean(delegationSelector));
        delete events[typeEvent][fn.uidEvent];
    }
    function removeNamespacedHandlers(element, events, typeEvent, namespace) {
        const storeElementEvent = events[typeEvent] || {};
        Object.keys(storeElementEvent).forEach(handlerKey => {
            if (handlerKey.includes(namespace)) {
                const event = storeElementEvent[handlerKey];
                removeHandler(element, events, typeEvent, event.originalHandler, event.delegationSelector);
            }
        });
    }
    function getTypeEvent(event) {
        event = event.replace(stripNameRegex, "");
        return customEvents[event] || event;
    }
    const EventHandler = {
        on(element, event, handler, delegationFn) {
            addHandler(element, event, handler, delegationFn, false);
        },
        one(element, event, handler, delegationFn) {
            addHandler(element, event, handler, delegationFn, true);
        },
        off(element, originalTypeEvent, handler, delegationFn) {
            if (typeof originalTypeEvent !== "string" || !element) {
                return;
            }
            const [ delegation, originalHandler, typeEvent ] = normalizeParams(originalTypeEvent, handler, delegationFn);
            const inNamespace = typeEvent !== originalTypeEvent;
            const events = getEvent(element);
            const isNamespace = originalTypeEvent.startsWith(".");
            if (typeof originalHandler !== "undefined") {
                if (!events || !events[typeEvent]) {
                    return;
                }
                removeHandler(element, events, typeEvent, originalHandler, delegation ? handler : null);
                return;
            }
            if (isNamespace) {
                Object.keys(events).forEach(elementEvent => {
                    removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.slice(1));
                });
            }
            const storeElementEvent = events[typeEvent] || {};
            Object.keys(storeElementEvent).forEach(keyHandlers => {
                const handlerKey = keyHandlers.replace(stripUidRegex, "");
                if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
                    const event = storeElementEvent[keyHandlers];
                    removeHandler(element, events, typeEvent, event.originalHandler, event.delegationSelector);
                }
            });
        },
        trigger(element, event, args) {
            if (typeof event !== "string" || !element) {
                return null;
            }
            const $ = getjQuery();
            const typeEvent = getTypeEvent(event);
            const inNamespace = event !== typeEvent;
            const isNative = nativeEvents.has(typeEvent);
            let jQueryEvent;
            let bubbles = true;
            let nativeDispatch = true;
            let defaultPrevented = false;
            let evt = null;
            if (inNamespace && $) {
                jQueryEvent = $.Event(event, args);
                $(element).trigger(jQueryEvent);
                bubbles = !jQueryEvent.isPropagationStopped();
                nativeDispatch = !jQueryEvent.isImmediatePropagationStopped();
                defaultPrevented = jQueryEvent.isDefaultPrevented();
            }
            if (isNative) {
                evt = document.createEvent("HTMLEvents");
                evt.initEvent(typeEvent, bubbles, true);
            } else {
                evt = new CustomEvent(event, {
                    bubbles: bubbles,
                    cancelable: true
                });
            }
            if (typeof args !== "undefined") {
                Object.keys(args).forEach(key => {
                    Object.defineProperty(evt, key, {
                        get() {
                            return args[key];
                        }
                    });
                });
            }
            if (defaultPrevented) {
                evt.preventDefault();
            }
            if (nativeDispatch) {
                element.dispatchEvent(evt);
            }
            if (evt.defaultPrevented && typeof jQueryEvent !== "undefined") {
                jQueryEvent.preventDefault();
            }
            return evt;
        }
    };
    const elementMap = new Map();
    const Data = {
        set(element, key, instance) {
            if (!elementMap.has(element)) {
                elementMap.set(element, new Map());
            }
            const instanceMap = elementMap.get(element);
            if (!instanceMap.has(key) && instanceMap.size !== 0) {
                console.error(`Bootstrap doesn't allow more than one instance per element. Bound instance: ${Array.from(instanceMap.keys())[0]}.`);
                return;
            }
            instanceMap.set(key, instance);
        },
        get(element, key) {
            if (elementMap.has(element)) {
                return elementMap.get(element).get(key) || null;
            }
            return null;
        },
        remove(element, key) {
            if (!elementMap.has(element)) {
                return;
            }
            const instanceMap = elementMap.get(element);
            instanceMap.delete(key);
            if (instanceMap.size === 0) {
                elementMap.delete(element);
            }
        }
    };
    const VERSION = "5.1.3";
    class BaseComponent {
        constructor(element) {
            element = getElement(element);
            if (!element) {
                return;
            }
            this._element = element;
            Data.set(this._element, this.constructor.DATA_KEY, this);
        }
        dispose() {
            Data.remove(this._element, this.constructor.DATA_KEY);
            EventHandler.off(this._element, this.constructor.EVENT_KEY);
            Object.getOwnPropertyNames(this).forEach(propertyName => {
                this[propertyName] = null;
            });
        }
        _queueCallback(callback, element, isAnimated = true) {
            executeAfterTransition(callback, element, isAnimated);
        }
        static getInstance(element) {
            return Data.get(getElement(element), this.DATA_KEY);
        }
        static getOrCreateInstance(element, config = {}) {
            return this.getInstance(element) || new this(element, typeof config === "object" ? config : null);
        }
        static get VERSION() {
            return VERSION;
        }
        static get NAME() {
            throw new Error('You have to implement the static method "NAME", for each component!');
        }
        static get DATA_KEY() {
            return `bs.${this.NAME}`;
        }
        static get EVENT_KEY() {
            return `.${this.DATA_KEY}`;
        }
    }
    const enableDismissTrigger = (component, method = "hide") => {
        const clickEvent = `click.dismiss${component.EVENT_KEY}`;
        const name = component.NAME;
        EventHandler.on(document, clickEvent, `[data-bs-dismiss="${name}"]`, function(event) {
            if ([ "A", "AREA" ].includes(this.tagName)) {
                event.preventDefault();
            }
            if (isDisabled(this)) {
                return;
            }
            const target = getElementFromSelector(this) || this.closest(`.${name}`);
            const instance = component.getOrCreateInstance(target);
            instance[method]();
        });
    };
    const NAME$d = "alert";
    const DATA_KEY$c = "bs.alert";
    const EVENT_KEY$c = `.${DATA_KEY$c}`;
    const EVENT_CLOSE = `close${EVENT_KEY$c}`;
    const EVENT_CLOSED = `closed${EVENT_KEY$c}`;
    const CLASS_NAME_FADE$5 = "fade";
    const CLASS_NAME_SHOW$8 = "show";
    class Alert extends BaseComponent {
        static get NAME() {
            return NAME$d;
        }
        close() {
            const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE);
            if (closeEvent.defaultPrevented) {
                return;
            }
            this._element.classList.remove(CLASS_NAME_SHOW$8);
            const isAnimated = this._element.classList.contains(CLASS_NAME_FADE$5);
            this._queueCallback(() => this._destroyElement(), this._element, isAnimated);
        }
        _destroyElement() {
            this._element.remove();
            EventHandler.trigger(this._element, EVENT_CLOSED);
            this.dispose();
        }
        static jQueryInterface(config) {
            return this.each(function() {
                const data = Alert.getOrCreateInstance(this);
                if (typeof config !== "string") {
                    return;
                }
                if (data[config] === undefined || config.startsWith("_") || config === "constructor") {
                    throw new TypeError(`No method named "${config}"`);
                }
                data[config](this);
            });
        }
    }
    enableDismissTrigger(Alert, "close");
    defineJQueryPlugin(Alert);
    const NAME$c = "button";
    const DATA_KEY$b = "bs.button";
    const EVENT_KEY$b = `.${DATA_KEY$b}`;
    const DATA_API_KEY$7 = ".data-api";
    const CLASS_NAME_ACTIVE$3 = "active";
    const SELECTOR_DATA_TOGGLE$5 = '[data-bs-toggle="button"]';
    const EVENT_CLICK_DATA_API$6 = `click${EVENT_KEY$b}${DATA_API_KEY$7}`;
    class Button extends BaseComponent {
        static get NAME() {
            return NAME$c;
        }
        toggle() {
            this._element.setAttribute("aria-pressed", this._element.classList.toggle(CLASS_NAME_ACTIVE$3));
        }
        static jQueryInterface(config) {
            return this.each(function() {
                const data = Button.getOrCreateInstance(this);
                if (config === "toggle") {
                    data[config]();
                }
            });
        }
    }
    EventHandler.on(document, EVENT_CLICK_DATA_API$6, SELECTOR_DATA_TOGGLE$5, event => {
        event.preventDefault();
        const button = event.target.closest(SELECTOR_DATA_TOGGLE$5);
        const data = Button.getOrCreateInstance(button);
        data.toggle();
    });
    defineJQueryPlugin(Button);
    function normalizeData(val) {
        if (val === "true") {
            return true;
        }
        if (val === "false") {
            return false;
        }
        if (val === Number(val).toString()) {
            return Number(val);
        }
        if (val === "" || val === "null") {
            return null;
        }
        return val;
    }
    function normalizeDataKey(key) {
        return key.replace(/[A-Z]/g, chr => `-${chr.toLowerCase()}`);
    }
    const Manipulator = {
        setDataAttribute(element, key, value) {
            element.setAttribute(`data-bs-${normalizeDataKey(key)}`, value);
        },
        removeDataAttribute(element, key) {
            element.removeAttribute(`data-bs-${normalizeDataKey(key)}`);
        },
        getDataAttributes(element) {
            if (!element) {
                return {};
            }
            const attributes = {};
            Object.keys(element.dataset).filter(key => key.startsWith("bs")).forEach(key => {
                let pureKey = key.replace(/^bs/, "");
                pureKey = pureKey.charAt(0).toLowerCase() + pureKey.slice(1, pureKey.length);
                attributes[pureKey] = normalizeData(element.dataset[key]);
            });
            return attributes;
        },
        getDataAttribute(element, key) {
            return normalizeData(element.getAttribute(`data-bs-${normalizeDataKey(key)}`));
        },
        offset(element) {
            const rect = element.getBoundingClientRect();
            return {
                top: rect.top + window.pageYOffset,
                left: rect.left + window.pageXOffset
            };
        },
        position(element) {
            return {
                top: element.offsetTop,
                left: element.offsetLeft
            };
        }
    };
    const NODE_TEXT = 3;
    const SelectorEngine = {
        find(selector, element = document.documentElement) {
            return [].concat(...Element.prototype.querySelectorAll.call(element, selector));
        },
        findOne(selector, element = document.documentElement) {
            return Element.prototype.querySelector.call(element, selector);
        },
        children(element, selector) {
            return [].concat(...element.children).filter(child => child.matches(selector));
        },
        parents(element, selector) {
            const parents = [];
            let ancestor = element.parentNode;
            while (ancestor && ancestor.nodeType === Node.ELEMENT_NODE && ancestor.nodeType !== NODE_TEXT) {
                if (ancestor.matches(selector)) {
                    parents.push(ancestor);
                }
                ancestor = ancestor.parentNode;
            }
            return parents;
        },
        prev(element, selector) {
            let previous = element.previousElementSibling;
            while (previous) {
                if (previous.matches(selector)) {
                    return [ previous ];
                }
                previous = previous.previousElementSibling;
            }
            return [];
        },
        next(element, selector) {
            let next = element.nextElementSibling;
            while (next) {
                if (next.matches(selector)) {
                    return [ next ];
                }
                next = next.nextElementSibling;
            }
            return [];
        },
        focusableChildren(element) {
            const focusables = [ "a", "button", "input", "textarea", "select", "details", "[tabindex]", '[contenteditable="true"]' ].map(selector => `${selector}:not([tabindex^="-"])`).join(", ");
            return this.find(focusables, element).filter(el => !isDisabled(el) && isVisible(el));
        }
    };
    const NAME$b = "carousel";
    const DATA_KEY$a = "bs.carousel";
    const EVENT_KEY$a = `.${DATA_KEY$a}`;
    const DATA_API_KEY$6 = ".data-api";
    const ARROW_LEFT_KEY = "ArrowLeft";
    const ARROW_RIGHT_KEY = "ArrowRight";
    const TOUCHEVENT_COMPAT_WAIT = 500;
    const SWIPE_THRESHOLD = 40;
    const Default$a = {
        interval: 5e3,
        keyboard: true,
        slide: false,
        pause: "hover",
        wrap: true,
        touch: true
    };
    const DefaultType$a = {
        interval: "(number|boolean)",
        keyboard: "boolean",
        slide: "(boolean|string)",
        pause: "(string|boolean)",
        wrap: "boolean",
        touch: "boolean"
    };
    const ORDER_NEXT = "next";
    const ORDER_PREV = "prev";
    const DIRECTION_LEFT = "left";
    const DIRECTION_RIGHT = "right";
    const KEY_TO_DIRECTION = {
        [ARROW_LEFT_KEY]: DIRECTION_RIGHT,
        [ARROW_RIGHT_KEY]: DIRECTION_LEFT
    };
    const EVENT_SLIDE = `slide${EVENT_KEY$a}`;
    const EVENT_SLID = `slid${EVENT_KEY$a}`;
    const EVENT_KEYDOWN = `keydown${EVENT_KEY$a}`;
    const EVENT_MOUSEENTER = `mouseenter${EVENT_KEY$a}`;
    const EVENT_MOUSELEAVE = `mouseleave${EVENT_KEY$a}`;
    const EVENT_TOUCHSTART = `touchstart${EVENT_KEY$a}`;
    const EVENT_TOUCHMOVE = `touchmove${EVENT_KEY$a}`;
    const EVENT_TOUCHEND = `touchend${EVENT_KEY$a}`;
    const EVENT_POINTERDOWN = `pointerdown${EVENT_KEY$a}`;
    const EVENT_POINTERUP = `pointerup${EVENT_KEY$a}`;
    const EVENT_DRAG_START = `dragstart${EVENT_KEY$a}`;
    const EVENT_LOAD_DATA_API$2 = `load${EVENT_KEY$a}${DATA_API_KEY$6}`;
    const EVENT_CLICK_DATA_API$5 = `click${EVENT_KEY$a}${DATA_API_KEY$6}`;
    const CLASS_NAME_CAROUSEL = "carousel";
    const CLASS_NAME_ACTIVE$2 = "active";
    const CLASS_NAME_SLIDE = "slide";
    const CLASS_NAME_END = "carousel-item-end";
    const CLASS_NAME_START = "carousel-item-start";
    const CLASS_NAME_NEXT = "carousel-item-next";
    const CLASS_NAME_PREV = "carousel-item-prev";
    const CLASS_NAME_POINTER_EVENT = "pointer-event";
    const SELECTOR_ACTIVE$1 = ".active";
    const SELECTOR_ACTIVE_ITEM = ".active.carousel-item";
    const SELECTOR_ITEM = ".carousel-item";
    const SELECTOR_ITEM_IMG = ".carousel-item img";
    const SELECTOR_NEXT_PREV = ".carousel-item-next, .carousel-item-prev";
    const SELECTOR_INDICATORS = ".carousel-indicators";
    const SELECTOR_INDICATOR = "[data-bs-target]";
    const SELECTOR_DATA_SLIDE = "[data-bs-slide], [data-bs-slide-to]";
    const SELECTOR_DATA_RIDE = '[data-bs-ride="carousel"]';
    const POINTER_TYPE_TOUCH = "touch";
    const POINTER_TYPE_PEN = "pen";
    class Carousel extends BaseComponent {
        constructor(element, config) {
            super(element);
            this._items = null;
            this._interval = null;
            this._activeElement = null;
            this._isPaused = false;
            this._isSliding = false;
            this.touchTimeout = null;
            this.touchStartX = 0;
            this.touchDeltaX = 0;
            this._config = this._getConfig(config);
            this._indicatorsElement = SelectorEngine.findOne(SELECTOR_INDICATORS, this._element);
            this._touchSupported = "ontouchstart" in document.documentElement || navigator.maxTouchPoints > 0;
            this._pointerEvent = Boolean(window.PointerEvent);
            this._addEventListeners();
        }
        static get Default() {
            return Default$a;
        }
        static get NAME() {
            return NAME$b;
        }
        next() {
            this._slide(ORDER_NEXT);
        }
        nextWhenVisible() {
            if (!document.hidden && isVisible(this._element)) {
                this.next();
            }
        }
        prev() {
            this._slide(ORDER_PREV);
        }
        pause(event) {
            if (!event) {
                this._isPaused = true;
            }
            if (SelectorEngine.findOne(SELECTOR_NEXT_PREV, this._element)) {
                triggerTransitionEnd(this._element);
                this.cycle(true);
            }
            clearInterval(this._interval);
            this._interval = null;
        }
        cycle(event) {
            if (!event) {
                this._isPaused = false;
            }
            if (this._interval) {
                clearInterval(this._interval);
                this._interval = null;
            }
            if (this._config && this._config.interval && !this._isPaused) {
                this._updateInterval();
                this._interval = setInterval((document.visibilityState ? this.nextWhenVisible : this.next).bind(this), this._config.interval);
            }
        }
        to(index) {
            this._activeElement = SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element);
            const activeIndex = this._getItemIndex(this._activeElement);
            if (index > this._items.length - 1 || index < 0) {
                return;
            }
            if (this._isSliding) {
                EventHandler.one(this._element, EVENT_SLID, () => this.to(index));
                return;
            }
            if (activeIndex === index) {
                this.pause();
                this.cycle();
                return;
            }
            const order = index > activeIndex ? ORDER_NEXT : ORDER_PREV;
            this._slide(order, this._items[index]);
        }
        _getConfig(config) {
            config = {
                ...Default$a,
                ...Manipulator.getDataAttributes(this._element),
                ...typeof config === "object" ? config : {}
            };
            typeCheckConfig(NAME$b, config, DefaultType$a);
            return config;
        }
        _handleSwipe() {
            const absDeltax = Math.abs(this.touchDeltaX);
            if (absDeltax <= SWIPE_THRESHOLD) {
                return;
            }
            const direction = absDeltax / this.touchDeltaX;
            this.touchDeltaX = 0;
            if (!direction) {
                return;
            }
            this._slide(direction > 0 ? DIRECTION_RIGHT : DIRECTION_LEFT);
        }
        _addEventListeners() {
            if (this._config.keyboard) {
                EventHandler.on(this._element, EVENT_KEYDOWN, event => this._keydown(event));
            }
            if (this._config.pause === "hover") {
                EventHandler.on(this._element, EVENT_MOUSEENTER, event => this.pause(event));
                EventHandler.on(this._element, EVENT_MOUSELEAVE, event => this.cycle(event));
            }
            if (this._config.touch && this._touchSupported) {
                this._addTouchEventListeners();
            }
        }
        _addTouchEventListeners() {
            const hasPointerPenTouch = event => {
                return this._pointerEvent && (event.pointerType === POINTER_TYPE_PEN || event.pointerType === POINTER_TYPE_TOUCH);
            };
            const start = event => {
                if (hasPointerPenTouch(event)) {
                    this.touchStartX = event.clientX;
                } else if (!this._pointerEvent) {
                    this.touchStartX = event.touches[0].clientX;
                }
            };
            const move = event => {
                this.touchDeltaX = event.touches && event.touches.length > 1 ? 0 : event.touches[0].clientX - this.touchStartX;
            };
            const end = event => {
                if (hasPointerPenTouch(event)) {
                    this.touchDeltaX = event.clientX - this.touchStartX;
                }
                this._handleSwipe();
                if (this._config.pause === "hover") {
                    this.pause();
                    if (this.touchTimeout) {
                        clearTimeout(this.touchTimeout);
                    }
                    this.touchTimeout = setTimeout(event => this.cycle(event), TOUCHEVENT_COMPAT_WAIT + this._config.interval);
                }
            };
            SelectorEngine.find(SELECTOR_ITEM_IMG, this._element).forEach(itemImg => {
                EventHandler.on(itemImg, EVENT_DRAG_START, event => event.preventDefault());
            });
            if (this._pointerEvent) {
                EventHandler.on(this._element, EVENT_POINTERDOWN, event => start(event));
                EventHandler.on(this._element, EVENT_POINTERUP, event => end(event));
                this._element.classList.add(CLASS_NAME_POINTER_EVENT);
            } else {
                EventHandler.on(this._element, EVENT_TOUCHSTART, event => start(event));
                EventHandler.on(this._element, EVENT_TOUCHMOVE, event => move(event));
                EventHandler.on(this._element, EVENT_TOUCHEND, event => end(event));
            }
        }
        _keydown(event) {
            if (/input|textarea/i.test(event.target.tagName)) {
                return;
            }
            const direction = KEY_TO_DIRECTION[event.key];
            if (direction) {
                event.preventDefault();
                this._slide(direction);
            }
        }
        _getItemIndex(element) {
            this._items = element && element.parentNode ? SelectorEngine.find(SELECTOR_ITEM, element.parentNode) : [];
            return this._items.indexOf(element);
        }
        _getItemByOrder(order, activeElement) {
            const isNext = order === ORDER_NEXT;
            return getNextActiveElement(this._items, activeElement, isNext, this._config.wrap);
        }
        _triggerSlideEvent(relatedTarget, eventDirectionName) {
            const targetIndex = this._getItemIndex(relatedTarget);
            const fromIndex = this._getItemIndex(SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element));
            return EventHandler.trigger(this._element, EVENT_SLIDE, {
                relatedTarget: relatedTarget,
                direction: eventDirectionName,
                from: fromIndex,
                to: targetIndex
            });
        }
        _setActiveIndicatorElement(element) {
            if (this._indicatorsElement) {
                const activeIndicator = SelectorEngine.findOne(SELECTOR_ACTIVE$1, this._indicatorsElement);
                activeIndicator.classList.remove(CLASS_NAME_ACTIVE$2);
                activeIndicator.removeAttribute("aria-current");
                const indicators = SelectorEngine.find(SELECTOR_INDICATOR, this._indicatorsElement);
                for (let i = 0; i < indicators.length; i++) {
                    if (Number.parseInt(indicators[i].getAttribute("data-bs-slide-to"), 10) === this._getItemIndex(element)) {
                        indicators[i].classList.add(CLASS_NAME_ACTIVE$2);
                        indicators[i].setAttribute("aria-current", "true");
                        break;
                    }
                }
            }
        }
        _updateInterval() {
            const element = this._activeElement || SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element);
            if (!element) {
                return;
            }
            const elementInterval = Number.parseInt(element.getAttribute("data-bs-interval"), 10);
            if (elementInterval) {
                this._config.defaultInterval = this._config.defaultInterval || this._config.interval;
                this._config.interval = elementInterval;
            } else {
                this._config.interval = this._config.defaultInterval || this._config.interval;
            }
        }
        _slide(directionOrOrder, element) {
            const order = this._directionToOrder(directionOrOrder);
            const activeElement = SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element);
            const activeElementIndex = this._getItemIndex(activeElement);
            const nextElement = element || this._getItemByOrder(order, activeElement);
            const nextElementIndex = this._getItemIndex(nextElement);
            const isCycling = Boolean(this._interval);
            const isNext = order === ORDER_NEXT;
            const directionalClassName = isNext ? CLASS_NAME_START : CLASS_NAME_END;
            const orderClassName = isNext ? CLASS_NAME_NEXT : CLASS_NAME_PREV;
            const eventDirectionName = this._orderToDirection(order);
            if (nextElement && nextElement.classList.contains(CLASS_NAME_ACTIVE$2)) {
                this._isSliding = false;
                return;
            }
            if (this._isSliding) {
                return;
            }
            const slideEvent = this._triggerSlideEvent(nextElement, eventDirectionName);
            if (slideEvent.defaultPrevented) {
                return;
            }
            if (!activeElement || !nextElement) {
                return;
            }
            this._isSliding = true;
            if (isCycling) {
                this.pause();
            }
            this._setActiveIndicatorElement(nextElement);
            this._activeElement = nextElement;
            const triggerSlidEvent = () => {
                EventHandler.trigger(this._element, EVENT_SLID, {
                    relatedTarget: nextElement,
                    direction: eventDirectionName,
                    from: activeElementIndex,
                    to: nextElementIndex
                });
            };
            if (this._element.classList.contains(CLASS_NAME_SLIDE)) {
                nextElement.classList.add(orderClassName);
                reflow(nextElement);
                activeElement.classList.add(directionalClassName);
                nextElement.classList.add(directionalClassName);
                const completeCallBack = () => {
                    nextElement.classList.remove(directionalClassName, orderClassName);
                    nextElement.classList.add(CLASS_NAME_ACTIVE$2);
                    activeElement.classList.remove(CLASS_NAME_ACTIVE$2, orderClassName, directionalClassName);
                    this._isSliding = false;
                    setTimeout(triggerSlidEvent, 0);
                };
                this._queueCallback(completeCallBack, activeElement, true);
            } else {
                activeElement.classList.remove(CLASS_NAME_ACTIVE$2);
                nextElement.classList.add(CLASS_NAME_ACTIVE$2);
                this._isSliding = false;
                triggerSlidEvent();
            }
            if (isCycling) {
                this.cycle();
            }
        }
        _directionToOrder(direction) {
            if (![ DIRECTION_RIGHT, DIRECTION_LEFT ].includes(direction)) {
                return direction;
            }
            if (isRTL()) {
                return direction === DIRECTION_LEFT ? ORDER_PREV : ORDER_NEXT;
            }
            return direction === DIRECTION_LEFT ? ORDER_NEXT : ORDER_PREV;
        }
        _orderToDirection(order) {
            if (![ ORDER_NEXT, ORDER_PREV ].includes(order)) {
                return order;
            }
            if (isRTL()) {
                return order === ORDER_PREV ? DIRECTION_LEFT : DIRECTION_RIGHT;
            }
            return order === ORDER_PREV ? DIRECTION_RIGHT : DIRECTION_LEFT;
        }
        static carouselInterface(element, config) {
            const data = Carousel.getOrCreateInstance(element, config);
            let {
                _config
            } = data;
            if (typeof config === "object") {
                _config = {
                    ..._config,
                    ...config
                };
            }
            const action = typeof config === "string" ? config : _config.slide;
            if (typeof config === "number") {
                data.to(config);
            } else if (typeof action === "string") {
                if (typeof data[action] === "undefined") {
                    throw new TypeError(`No method named "${action}"`);
                }
                data[action]();
            } else if (_config.interval && _config.ride) {
                data.pause();
                data.cycle();
            }
        }
        static jQueryInterface(config) {
            return this.each(function() {
                Carousel.carouselInterface(this, config);
            });
        }
        static dataApiClickHandler(event) {
            const target = getElementFromSelector(this);
            if (!target || !target.classList.contains(CLASS_NAME_CAROUSEL)) {
                return;
            }
            const config = {
                ...Manipulator.getDataAttributes(target),
                ...Manipulator.getDataAttributes(this)
            };
            const slideIndex = this.getAttribute("data-bs-slide-to");
            if (slideIndex) {
                config.interval = false;
            }
            Carousel.carouselInterface(target, config);
            if (slideIndex) {
                Carousel.getInstance(target).to(slideIndex);
            }
            event.preventDefault();
        }
    }
    EventHandler.on(document, EVENT_CLICK_DATA_API$5, SELECTOR_DATA_SLIDE, Carousel.dataApiClickHandler);
    EventHandler.on(window, EVENT_LOAD_DATA_API$2, () => {
        const carousels = SelectorEngine.find(SELECTOR_DATA_RIDE);
        for (let i = 0, len = carousels.length; i < len; i++) {
            Carousel.carouselInterface(carousels[i], Carousel.getInstance(carousels[i]));
        }
    });
    defineJQueryPlugin(Carousel);
    const NAME$a = "collapse";
    const DATA_KEY$9 = "bs.collapse";
    const EVENT_KEY$9 = `.${DATA_KEY$9}`;
    const DATA_API_KEY$5 = ".data-api";
    const Default$9 = {
        toggle: true,
        parent: null
    };
    const DefaultType$9 = {
        toggle: "boolean",
        parent: "(null|element)"
    };
    const EVENT_SHOW$5 = `show${EVENT_KEY$9}`;
    const EVENT_SHOWN$5 = `shown${EVENT_KEY$9}`;
    const EVENT_HIDE$5 = `hide${EVENT_KEY$9}`;
    const EVENT_HIDDEN$5 = `hidden${EVENT_KEY$9}`;
    const EVENT_CLICK_DATA_API$4 = `click${EVENT_KEY$9}${DATA_API_KEY$5}`;
    const CLASS_NAME_SHOW$7 = "show";
    const CLASS_NAME_COLLAPSE = "collapse";
    const CLASS_NAME_COLLAPSING = "collapsing";
    const CLASS_NAME_COLLAPSED = "collapsed";
    const CLASS_NAME_DEEPER_CHILDREN = `:scope .${CLASS_NAME_COLLAPSE} .${CLASS_NAME_COLLAPSE}`;
    const CLASS_NAME_HORIZONTAL = "collapse-horizontal";
    const WIDTH = "width";
    const HEIGHT = "height";
    const SELECTOR_ACTIVES = ".collapse.show, .collapse.collapsing";
    const SELECTOR_DATA_TOGGLE$4 = '[data-bs-toggle="collapse"]';
    class Collapse extends BaseComponent {
        constructor(element, config) {
            super(element);
            this._isTransitioning = false;
            this._config = this._getConfig(config);
            this._triggerArray = [];
            const toggleList = SelectorEngine.find(SELECTOR_DATA_TOGGLE$4);
            for (let i = 0, len = toggleList.length; i < len; i++) {
                const elem = toggleList[i];
                const selector = getSelectorFromElement(elem);
                const filterElement = SelectorEngine.find(selector).filter(foundElem => foundElem === this._element);
                if (selector !== null && filterElement.length) {
                    this._selector = selector;
                    this._triggerArray.push(elem);
                }
            }
            this._initializeChildren();
            if (!this._config.parent) {
                this._addAriaAndCollapsedClass(this._triggerArray, this._isShown());
            }
            if (this._config.toggle) {
                this.toggle();
            }
        }
        static get Default() {
            return Default$9;
        }
        static get NAME() {
            return NAME$a;
        }
        toggle() {
            if (this._isShown()) {
                this.hide();
            } else {
                this.show();
            }
        }
        show() {
            if (this._isTransitioning || this._isShown()) {
                return;
            }
            let actives = [];
            let activesData;
            if (this._config.parent) {
                const children = SelectorEngine.find(CLASS_NAME_DEEPER_CHILDREN, this._config.parent);
                actives = SelectorEngine.find(SELECTOR_ACTIVES, this._config.parent).filter(elem => !children.includes(elem));
            }
            const container = SelectorEngine.findOne(this._selector);
            if (actives.length) {
                const tempActiveData = actives.find(elem => container !== elem);
                activesData = tempActiveData ? Collapse.getInstance(tempActiveData) : null;
                if (activesData && activesData._isTransitioning) {
                    return;
                }
            }
            const startEvent = EventHandler.trigger(this._element, EVENT_SHOW$5);
            if (startEvent.defaultPrevented) {
                return;
            }
            actives.forEach(elemActive => {
                if (container !== elemActive) {
                    Collapse.getOrCreateInstance(elemActive, {
                        toggle: false
                    }).hide();
                }
                if (!activesData) {
                    Data.set(elemActive, DATA_KEY$9, null);
                }
            });
            const dimension = this._getDimension();
            this._element.classList.remove(CLASS_NAME_COLLAPSE);
            this._element.classList.add(CLASS_NAME_COLLAPSING);
            this._element.style[dimension] = 0;
            this._addAriaAndCollapsedClass(this._triggerArray, true);
            this._isTransitioning = true;
            const complete = () => {
                this._isTransitioning = false;
                this._element.classList.remove(CLASS_NAME_COLLAPSING);
                this._element.classList.add(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);
                this._element.style[dimension] = "";
                EventHandler.trigger(this._element, EVENT_SHOWN$5);
            };
            const capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1);
            const scrollSize = `scroll${capitalizedDimension}`;
            this._queueCallback(complete, this._element, true);
            this._element.style[dimension] = `${this._element[scrollSize]}px`;
        }
        hide() {
            if (this._isTransitioning || !this._isShown()) {
                return;
            }
            const startEvent = EventHandler.trigger(this._element, EVENT_HIDE$5);
            if (startEvent.defaultPrevented) {
                return;
            }
            const dimension = this._getDimension();
            this._element.style[dimension] = `${this._element.getBoundingClientRect()[dimension]}px`;
            reflow(this._element);
            this._element.classList.add(CLASS_NAME_COLLAPSING);
            this._element.classList.remove(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);
            const triggerArrayLength = this._triggerArray.length;
            for (let i = 0; i < triggerArrayLength; i++) {
                const trigger = this._triggerArray[i];
                const elem = getElementFromSelector(trigger);
                if (elem && !this._isShown(elem)) {
                    this._addAriaAndCollapsedClass([ trigger ], false);
                }
            }
            this._isTransitioning = true;
            const complete = () => {
                this._isTransitioning = false;
                this._element.classList.remove(CLASS_NAME_COLLAPSING);
                this._element.classList.add(CLASS_NAME_COLLAPSE);
                EventHandler.trigger(this._element, EVENT_HIDDEN$5);
            };
            this._element.style[dimension] = "";
            this._queueCallback(complete, this._element, true);
        }
        _isShown(element = this._element) {
            return element.classList.contains(CLASS_NAME_SHOW$7);
        }
        _getConfig(config) {
            config = {
                ...Default$9,
                ...Manipulator.getDataAttributes(this._element),
                ...config
            };
            config.toggle = Boolean(config.toggle);
            config.parent = getElement(config.parent);
            typeCheckConfig(NAME$a, config, DefaultType$9);
            return config;
        }
        _getDimension() {
            return this._element.classList.contains(CLASS_NAME_HORIZONTAL) ? WIDTH : HEIGHT;
        }
        _initializeChildren() {
            if (!this._config.parent) {
                return;
            }
            const children = SelectorEngine.find(CLASS_NAME_DEEPER_CHILDREN, this._config.parent);
            SelectorEngine.find(SELECTOR_DATA_TOGGLE$4, this._config.parent).filter(elem => !children.includes(elem)).forEach(element => {
                const selected = getElementFromSelector(element);
                if (selected) {
                    this._addAriaAndCollapsedClass([ element ], this._isShown(selected));
                }
            });
        }
        _addAriaAndCollapsedClass(triggerArray, isOpen) {
            if (!triggerArray.length) {
                return;
            }
            triggerArray.forEach(elem => {
                if (isOpen) {
                    elem.classList.remove(CLASS_NAME_COLLAPSED);
                } else {
                    elem.classList.add(CLASS_NAME_COLLAPSED);
                }
                elem.setAttribute("aria-expanded", isOpen);
            });
        }
        static jQueryInterface(config) {
            return this.each(function() {
                const _config = {};
                if (typeof config === "string" && /show|hide/.test(config)) {
                    _config.toggle = false;
                }
                const data = Collapse.getOrCreateInstance(this, _config);
                if (typeof config === "string") {
                    if (typeof data[config] === "undefined") {
                        throw new TypeError(`No method named "${config}"`);
                    }
                    data[config]();
                }
            });
        }
    }
    EventHandler.on(document, EVENT_CLICK_DATA_API$4, SELECTOR_DATA_TOGGLE$4, function(event) {
        if (event.target.tagName === "A" || event.delegateTarget && event.delegateTarget.tagName === "A") {
            event.preventDefault();
        }
        const selector = getSelectorFromElement(this);
        const selectorElements = SelectorEngine.find(selector);
        selectorElements.forEach(element => {
            Collapse.getOrCreateInstance(element, {
                toggle: false
            }).toggle();
        });
    });
    defineJQueryPlugin(Collapse);
    var top = "top";
    var bottom = "bottom";
    var right = "right";
    var left = "left";
    var auto = "auto";
    var basePlacements = [ top, bottom, right, left ];
    var start = "start";
    var end = "end";
    var clippingParents = "clippingParents";
    var viewport = "viewport";
    var popper = "popper";
    var reference = "reference";
    var variationPlacements = basePlacements.reduce(function(acc, placement) {
        return acc.concat([ placement + "-" + start, placement + "-" + end ]);
    }, []);
    var placements = [].concat(basePlacements, [ auto ]).reduce(function(acc, placement) {
        return acc.concat([ placement, placement + "-" + start, placement + "-" + end ]);
    }, []);
    var beforeRead = "beforeRead";
    var read = "read";
    var afterRead = "afterRead";
    var beforeMain = "beforeMain";
    var main = "main";
    var afterMain = "afterMain";
    var beforeWrite = "beforeWrite";
    var write = "write";
    var afterWrite = "afterWrite";
    var modifierPhases = [ beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite ];
    function getNodeName(element) {
        return element ? (element.nodeName || "").toLowerCase() : null;
    }
    function getWindow(node) {
        if (node == null) {
            return window;
        }
        if (node.toString() !== "[object Window]") {
            var ownerDocument = node.ownerDocument;
            return ownerDocument ? ownerDocument.defaultView || window : window;
        }
        return node;
    }
    function isElement(node) {
        var OwnElement = getWindow(node).Element;
        return node instanceof OwnElement || node instanceof Element;
    }
    function isHTMLElement(node) {
        var OwnElement = getWindow(node).HTMLElement;
        return node instanceof OwnElement || node instanceof HTMLElement;
    }
    function isShadowRoot(node) {
        if (typeof ShadowRoot === "undefined") {
            return false;
        }
        var OwnElement = getWindow(node).ShadowRoot;
        return node instanceof OwnElement || node instanceof ShadowRoot;
    }
    function applyStyles(_ref) {
        var state = _ref.state;
        Object.keys(state.elements).forEach(function(name) {
            var style = state.styles[name] || {};
            var attributes = state.attributes[name] || {};
            var element = state.elements[name];
            if (!isHTMLElement(element) || !getNodeName(element)) {
                return;
            }
            Object.assign(element.style, style);
            Object.keys(attributes).forEach(function(name) {
                var value = attributes[name];
                if (value === false) {
                    element.removeAttribute(name);
                } else {
                    element.setAttribute(name, value === true ? "" : value);
                }
            });
        });
    }
    function effect$2(_ref2) {
        var state = _ref2.state;
        var initialStyles = {
            popper: {
                position: state.options.strategy,
                left: "0",
                top: "0",
                margin: "0"
            },
            arrow: {
                position: "absolute"
            },
            reference: {}
        };
        Object.assign(state.elements.popper.style, initialStyles.popper);
        state.styles = initialStyles;
        if (state.elements.arrow) {
            Object.assign(state.elements.arrow.style, initialStyles.arrow);
        }
        return function() {
            Object.keys(state.elements).forEach(function(name) {
                var element = state.elements[name];
                var attributes = state.attributes[name] || {};
                var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]);
                var style = styleProperties.reduce(function(style, property) {
                    style[property] = "";
                    return style;
                }, {});
                if (!isHTMLElement(element) || !getNodeName(element)) {
                    return;
                }
                Object.assign(element.style, style);
                Object.keys(attributes).forEach(function(attribute) {
                    element.removeAttribute(attribute);
                });
            });
        };
    }
    const applyStyles$1 = {
        name: "applyStyles",
        enabled: true,
        phase: "write",
        fn: applyStyles,
        effect: effect$2,
        requires: [ "computeStyles" ]
    };
    function getBasePlacement(placement) {
        return placement.split("-")[0];
    }
    function getBoundingClientRect(element, includeScale) {
        var rect = element.getBoundingClientRect();
        var scaleX = 1;
        var scaleY = 1;
        return {
            width: rect.width / scaleX,
            height: rect.height / scaleY,
            top: rect.top / scaleY,
            right: rect.right / scaleX,
            bottom: rect.bottom / scaleY,
            left: rect.left / scaleX,
            x: rect.left / scaleX,
            y: rect.top / scaleY
        };
    }
    function getLayoutRect(element) {
        var clientRect = getBoundingClientRect(element);
        var width = element.offsetWidth;
        var height = element.offsetHeight;
        if (Math.abs(clientRect.width - width) <= 1) {
            width = clientRect.width;
        }
        if (Math.abs(clientRect.height - height) <= 1) {
            height = clientRect.height;
        }
        return {
            x: element.offsetLeft,
            y: element.offsetTop,
            width: width,
            height: height
        };
    }
    function contains(parent, child) {
        var rootNode = child.getRootNode && child.getRootNode();
        if (parent.contains(child)) {
            return true;
        } else if (rootNode && isShadowRoot(rootNode)) {
            var next = child;
            do {
                if (next && parent.isSameNode(next)) {
                    return true;
                }
                next = next.parentNode || next.host;
            } while (next);
        }
        return false;
    }
    function getComputedStyle$1(element) {
        return getWindow(element).getComputedStyle(element);
    }
    function isTableElement(element) {
        return [ "table", "td", "th" ].indexOf(getNodeName(element)) >= 0;
    }
    function getDocumentElement(element) {
        return ((isElement(element) ? element.ownerDocument : element.document) || window.document).documentElement;
    }
    function getParentNode(element) {
        if (getNodeName(element) === "html") {
            return element;
        }
        return element.assignedSlot || element.parentNode || (isShadowRoot(element) ? element.host : null) || getDocumentElement(element);
    }
    function getTrueOffsetParent(element) {
        if (!isHTMLElement(element) || getComputedStyle$1(element).position === "fixed") {
            return null;
        }
        return element.offsetParent;
    }
    function getContainingBlock(element) {
        var isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") !== -1;
        var isIE = navigator.userAgent.indexOf("Trident") !== -1;
        if (isIE && isHTMLElement(element)) {
            var elementCss = getComputedStyle$1(element);
            if (elementCss.position === "fixed") {
                return null;
            }
        }
        var currentNode = getParentNode(element);
        while (isHTMLElement(currentNode) && [ "html", "body" ].indexOf(getNodeName(currentNode)) < 0) {
            var css = getComputedStyle$1(currentNode);
            if (css.transform !== "none" || css.perspective !== "none" || css.contain === "paint" || [ "transform", "perspective" ].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === "filter" || isFirefox && css.filter && css.filter !== "none") {
                return currentNode;
            } else {
                currentNode = currentNode.parentNode;
            }
        }
        return null;
    }
    function getOffsetParent(element) {
        var window = getWindow(element);
        var offsetParent = getTrueOffsetParent(element);
        while (offsetParent && isTableElement(offsetParent) && getComputedStyle$1(offsetParent).position === "static") {
            offsetParent = getTrueOffsetParent(offsetParent);
        }
        if (offsetParent && (getNodeName(offsetParent) === "html" || getNodeName(offsetParent) === "body" && getComputedStyle$1(offsetParent).position === "static")) {
            return window;
        }
        return offsetParent || getContainingBlock(element) || window;
    }
    function getMainAxisFromPlacement(placement) {
        return [ "top", "bottom" ].indexOf(placement) >= 0 ? "x" : "y";
    }
    var max = Math.max;
    var min = Math.min;
    var round = Math.round;
    function within(min$1, value, max$1) {
        return max(min$1, min(value, max$1));
    }
    function getFreshSideObject() {
        return {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        };
    }
    function mergePaddingObject(paddingObject) {
        return Object.assign({}, getFreshSideObject(), paddingObject);
    }
    function expandToHashMap(value, keys) {
        return keys.reduce(function(hashMap, key) {
            hashMap[key] = value;
            return hashMap;
        }, {});
    }
    var toPaddingObject = function toPaddingObject(padding, state) {
        padding = typeof padding === "function" ? padding(Object.assign({}, state.rects, {
            placement: state.placement
        })) : padding;
        return mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
    };
    function arrow(_ref) {
        var _state$modifiersData$;
        var state = _ref.state, name = _ref.name, options = _ref.options;
        var arrowElement = state.elements.arrow;
        var popperOffsets = state.modifiersData.popperOffsets;
        var basePlacement = getBasePlacement(state.placement);
        var axis = getMainAxisFromPlacement(basePlacement);
        var isVertical = [ left, right ].indexOf(basePlacement) >= 0;
        var len = isVertical ? "height" : "width";
        if (!arrowElement || !popperOffsets) {
            return;
        }
        var paddingObject = toPaddingObject(options.padding, state);
        var arrowRect = getLayoutRect(arrowElement);
        var minProp = axis === "y" ? top : left;
        var maxProp = axis === "y" ? bottom : right;
        var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets[axis] - state.rects.popper[len];
        var startDiff = popperOffsets[axis] - state.rects.reference[axis];
        var arrowOffsetParent = getOffsetParent(arrowElement);
        var clientSize = arrowOffsetParent ? axis === "y" ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
        var centerToReference = endDiff / 2 - startDiff / 2;
        var min = paddingObject[minProp];
        var max = clientSize - arrowRect[len] - paddingObject[maxProp];
        var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
        var offset = within(min, center, max);
        var axisProp = axis;
        state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset, 
        _state$modifiersData$.centerOffset = offset - center, _state$modifiersData$);
    }
    function effect$1(_ref2) {
        var state = _ref2.state, options = _ref2.options;
        var _options$element = options.element, arrowElement = _options$element === void 0 ? "[data-popper-arrow]" : _options$element;
        if (arrowElement == null) {
            return;
        }
        if (typeof arrowElement === "string") {
            arrowElement = state.elements.popper.querySelector(arrowElement);
            if (!arrowElement) {
                return;
            }
        }
        if (!contains(state.elements.popper, arrowElement)) {
            return;
        }
        state.elements.arrow = arrowElement;
    }
    const arrow$1 = {
        name: "arrow",
        enabled: true,
        phase: "main",
        fn: arrow,
        effect: effect$1,
        requires: [ "popperOffsets" ],
        requiresIfExists: [ "preventOverflow" ]
    };
    function getVariation(placement) {
        return placement.split("-")[1];
    }
    var unsetSides = {
        top: "auto",
        right: "auto",
        bottom: "auto",
        left: "auto"
    };
    function roundOffsetsByDPR(_ref) {
        var x = _ref.x, y = _ref.y;
        var win = window;
        var dpr = win.devicePixelRatio || 1;
        return {
            x: round(round(x * dpr) / dpr) || 0,
            y: round(round(y * dpr) / dpr) || 0
        };
    }
    function mapToStyles(_ref2) {
        var _Object$assign2;
        var popper = _ref2.popper, popperRect = _ref2.popperRect, placement = _ref2.placement, variation = _ref2.variation, offsets = _ref2.offsets, position = _ref2.position, gpuAcceleration = _ref2.gpuAcceleration, adaptive = _ref2.adaptive, roundOffsets = _ref2.roundOffsets;
        var _ref3 = roundOffsets === true ? roundOffsetsByDPR(offsets) : typeof roundOffsets === "function" ? roundOffsets(offsets) : offsets, _ref3$x = _ref3.x, x = _ref3$x === void 0 ? 0 : _ref3$x, _ref3$y = _ref3.y, y = _ref3$y === void 0 ? 0 : _ref3$y;
        var hasX = offsets.hasOwnProperty("x");
        var hasY = offsets.hasOwnProperty("y");
        var sideX = left;
        var sideY = top;
        var win = window;
        if (adaptive) {
            var offsetParent = getOffsetParent(popper);
            var heightProp = "clientHeight";
            var widthProp = "clientWidth";
            if (offsetParent === getWindow(popper)) {
                offsetParent = getDocumentElement(popper);
                if (getComputedStyle$1(offsetParent).position !== "static" && position === "absolute") {
                    heightProp = "scrollHeight";
                    widthProp = "scrollWidth";
                }
            }
            offsetParent = offsetParent;
            if (placement === top || (placement === left || placement === right) && variation === end) {
                sideY = bottom;
                y -= offsetParent[heightProp] - popperRect.height;
                y *= gpuAcceleration ? 1 : -1;
            }
            if (placement === left || (placement === top || placement === bottom) && variation === end) {
                sideX = right;
                x -= offsetParent[widthProp] - popperRect.width;
                x *= gpuAcceleration ? 1 : -1;
            }
        }
        var commonStyles = Object.assign({
            position: position
        }, adaptive && unsetSides);
        if (gpuAcceleration) {
            var _Object$assign;
            return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? "0" : "", 
            _Object$assign[sideX] = hasX ? "0" : "", _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", 
            _Object$assign));
        }
        return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : "", 
        _Object$assign2[sideX] = hasX ? x + "px" : "", _Object$assign2.transform = "", 
        _Object$assign2));
    }
    function computeStyles(_ref4) {
        var state = _ref4.state, options = _ref4.options;
        var _options$gpuAccelerat = options.gpuAcceleration, gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat, _options$adaptive = options.adaptive, adaptive = _options$adaptive === void 0 ? true : _options$adaptive, _options$roundOffsets = options.roundOffsets, roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;
        var commonStyles = {
            placement: getBasePlacement(state.placement),
            variation: getVariation(state.placement),
            popper: state.elements.popper,
            popperRect: state.rects.popper,
            gpuAcceleration: gpuAcceleration
        };
        if (state.modifiersData.popperOffsets != null) {
            state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
                offsets: state.modifiersData.popperOffsets,
                position: state.options.strategy,
                adaptive: adaptive,
                roundOffsets: roundOffsets
            })));
        }
        if (state.modifiersData.arrow != null) {
            state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
                offsets: state.modifiersData.arrow,
                position: "absolute",
                adaptive: false,
                roundOffsets: roundOffsets
            })));
        }
        state.attributes.popper = Object.assign({}, state.attributes.popper, {
            "data-popper-placement": state.placement
        });
    }
    const computeStyles$1 = {
        name: "computeStyles",
        enabled: true,
        phase: "beforeWrite",
        fn: computeStyles,
        data: {}
    };
    var passive = {
        passive: true
    };
    function effect(_ref) {
        var state = _ref.state, instance = _ref.instance, options = _ref.options;
        var _options$scroll = options.scroll, scroll = _options$scroll === void 0 ? true : _options$scroll, _options$resize = options.resize, resize = _options$resize === void 0 ? true : _options$resize;
        var window = getWindow(state.elements.popper);
        var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);
        if (scroll) {
            scrollParents.forEach(function(scrollParent) {
                scrollParent.addEventListener("scroll", instance.update, passive);
            });
        }
        if (resize) {
            window.addEventListener("resize", instance.update, passive);
        }
        return function() {
            if (scroll) {
                scrollParents.forEach(function(scrollParent) {
                    scrollParent.removeEventListener("scroll", instance.update, passive);
                });
            }
            if (resize) {
                window.removeEventListener("resize", instance.update, passive);
            }
        };
    }
    const eventListeners = {
        name: "eventListeners",
        enabled: true,
        phase: "write",
        fn: function fn() {},
        effect: effect,
        data: {}
    };
    var hash$1 = {
        left: "right",
        right: "left",
        bottom: "top",
        top: "bottom"
    };
    function getOppositePlacement(placement) {
        return placement.replace(/left|right|bottom|top/g, function(matched) {
            return hash$1[matched];
        });
    }
    var hash = {
        start: "end",
        end: "start"
    };
    function getOppositeVariationPlacement(placement) {
        return placement.replace(/start|end/g, function(matched) {
            return hash[matched];
        });
    }
    function getWindowScroll(node) {
        var win = getWindow(node);
        var scrollLeft = win.pageXOffset;
        var scrollTop = win.pageYOffset;
        return {
            scrollLeft: scrollLeft,
            scrollTop: scrollTop
        };
    }
    function getWindowScrollBarX(element) {
        return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
    }
    function getViewportRect(element) {
        var win = getWindow(element);
        var html = getDocumentElement(element);
        var visualViewport = win.visualViewport;
        var width = html.clientWidth;
        var height = html.clientHeight;
        var x = 0;
        var y = 0;
        if (visualViewport) {
            width = visualViewport.width;
            height = visualViewport.height;
            if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
                x = visualViewport.offsetLeft;
                y = visualViewport.offsetTop;
            }
        }
        return {
            width: width,
            height: height,
            x: x + getWindowScrollBarX(element),
            y: y
        };
    }
    function getDocumentRect(element) {
        var _element$ownerDocumen;
        var html = getDocumentElement(element);
        var winScroll = getWindowScroll(element);
        var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
        var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
        var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
        var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
        var y = -winScroll.scrollTop;
        if (getComputedStyle$1(body || html).direction === "rtl") {
            x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
        }
        return {
            width: width,
            height: height,
            x: x,
            y: y
        };
    }
    function isScrollParent(element) {
        var _getComputedStyle = getComputedStyle$1(element), overflow = _getComputedStyle.overflow, overflowX = _getComputedStyle.overflowX, overflowY = _getComputedStyle.overflowY;
        return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
    }
    function getScrollParent(node) {
        if ([ "html", "body", "#document" ].indexOf(getNodeName(node)) >= 0) {
            return node.ownerDocument.body;
        }
        if (isHTMLElement(node) && isScrollParent(node)) {
            return node;
        }
        return getScrollParent(getParentNode(node));
    }
    function listScrollParents(element, list) {
        var _element$ownerDocumen;
        if (list === void 0) {
            list = [];
        }
        var scrollParent = getScrollParent(element);
        var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
        var win = getWindow(scrollParent);
        var target = isBody ? [ win ].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
        var updatedList = list.concat(target);
        return isBody ? updatedList : updatedList.concat(listScrollParents(getParentNode(target)));
    }
    function rectToClientRect(rect) {
        return Object.assign({}, rect, {
            left: rect.x,
            top: rect.y,
            right: rect.x + rect.width,
            bottom: rect.y + rect.height
        });
    }
    function getInnerBoundingClientRect(element) {
        var rect = getBoundingClientRect(element);
        rect.top = rect.top + element.clientTop;
        rect.left = rect.left + element.clientLeft;
        rect.bottom = rect.top + element.clientHeight;
        rect.right = rect.left + element.clientWidth;
        rect.width = element.clientWidth;
        rect.height = element.clientHeight;
        rect.x = rect.left;
        rect.y = rect.top;
        return rect;
    }
    function getClientRectFromMixedType(element, clippingParent) {
        return clippingParent === viewport ? rectToClientRect(getViewportRect(element)) : isHTMLElement(clippingParent) ? getInnerBoundingClientRect(clippingParent) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
    }
    function getClippingParents(element) {
        var clippingParents = listScrollParents(getParentNode(element));
        var canEscapeClipping = [ "absolute", "fixed" ].indexOf(getComputedStyle$1(element).position) >= 0;
        var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;
        if (!isElement(clipperElement)) {
            return [];
        }
        return clippingParents.filter(function(clippingParent) {
            return isElement(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== "body";
        });
    }
    function getClippingRect(element, boundary, rootBoundary) {
        var mainClippingParents = boundary === "clippingParents" ? getClippingParents(element) : [].concat(boundary);
        var clippingParents = [].concat(mainClippingParents, [ rootBoundary ]);
        var firstClippingParent = clippingParents[0];
        var clippingRect = clippingParents.reduce(function(accRect, clippingParent) {
            var rect = getClientRectFromMixedType(element, clippingParent);
            accRect.top = max(rect.top, accRect.top);
            accRect.right = min(rect.right, accRect.right);
            accRect.bottom = min(rect.bottom, accRect.bottom);
            accRect.left = max(rect.left, accRect.left);
            return accRect;
        }, getClientRectFromMixedType(element, firstClippingParent));
        clippingRect.width = clippingRect.right - clippingRect.left;
        clippingRect.height = clippingRect.bottom - clippingRect.top;
        clippingRect.x = clippingRect.left;
        clippingRect.y = clippingRect.top;
        return clippingRect;
    }
    function computeOffsets(_ref) {
        var reference = _ref.reference, element = _ref.element, placement = _ref.placement;
        var basePlacement = placement ? getBasePlacement(placement) : null;
        var variation = placement ? getVariation(placement) : null;
        var commonX = reference.x + reference.width / 2 - element.width / 2;
        var commonY = reference.y + reference.height / 2 - element.height / 2;
        var offsets;
        switch (basePlacement) {
          case top:
            offsets = {
                x: commonX,
                y: reference.y - element.height
            };
            break;

          case bottom:
            offsets = {
                x: commonX,
                y: reference.y + reference.height
            };
            break;

          case right:
            offsets = {
                x: reference.x + reference.width,
                y: commonY
            };
            break;

          case left:
            offsets = {
                x: reference.x - element.width,
                y: commonY
            };
            break;

          default:
            offsets = {
                x: reference.x,
                y: reference.y
            };
        }
        var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;
        if (mainAxis != null) {
            var len = mainAxis === "y" ? "height" : "width";
            switch (variation) {
              case start:
                offsets[mainAxis] = offsets[mainAxis] - (reference[len] / 2 - element[len] / 2);
                break;

              case end:
                offsets[mainAxis] = offsets[mainAxis] + (reference[len] / 2 - element[len] / 2);
                break;
            }
        }
        return offsets;
    }
    function detectOverflow(state, options) {
        if (options === void 0) {
            options = {};
        }
        var _options = options, _options$placement = _options.placement, placement = _options$placement === void 0 ? state.placement : _options$placement, _options$boundary = _options.boundary, boundary = _options$boundary === void 0 ? clippingParents : _options$boundary, _options$rootBoundary = _options.rootBoundary, rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary, _options$elementConte = _options.elementContext, elementContext = _options$elementConte === void 0 ? popper : _options$elementConte, _options$altBoundary = _options.altBoundary, altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary, _options$padding = _options.padding, padding = _options$padding === void 0 ? 0 : _options$padding;
        var paddingObject = mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
        var altContext = elementContext === popper ? reference : popper;
        var popperRect = state.rects.popper;
        var element = state.elements[altBoundary ? altContext : elementContext];
        var clippingClientRect = getClippingRect(isElement(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary);
        var referenceClientRect = getBoundingClientRect(state.elements.reference);
        var popperOffsets = computeOffsets({
            reference: referenceClientRect,
            element: popperRect,
            strategy: "absolute",
            placement: placement
        });
        var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets));
        var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect;
        var overflowOffsets = {
            top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
            bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
            left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
            right: elementClientRect.right - clippingClientRect.right + paddingObject.right
        };
        var offsetData = state.modifiersData.offset;
        if (elementContext === popper && offsetData) {
            var offset = offsetData[placement];
            Object.keys(overflowOffsets).forEach(function(key) {
                var multiply = [ right, bottom ].indexOf(key) >= 0 ? 1 : -1;
                var axis = [ top, bottom ].indexOf(key) >= 0 ? "y" : "x";
                overflowOffsets[key] += offset[axis] * multiply;
            });
        }
        return overflowOffsets;
    }
    function computeAutoPlacement(state, options) {
        if (options === void 0) {
            options = {};
        }
        var _options = options, placement = _options.placement, boundary = _options.boundary, rootBoundary = _options.rootBoundary, padding = _options.padding, flipVariations = _options.flipVariations, _options$allowedAutoP = _options.allowedAutoPlacements, allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
        var variation = getVariation(placement);
        var placements$1 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function(placement) {
            return getVariation(placement) === variation;
        }) : basePlacements;
        var allowedPlacements = placements$1.filter(function(placement) {
            return allowedAutoPlacements.indexOf(placement) >= 0;
        });
        if (allowedPlacements.length === 0) {
            allowedPlacements = placements$1;
        }
        var overflows = allowedPlacements.reduce(function(acc, placement) {
            acc[placement] = detectOverflow(state, {
                placement: placement,
                boundary: boundary,
                rootBoundary: rootBoundary,
                padding: padding
            })[getBasePlacement(placement)];
            return acc;
        }, {});
        return Object.keys(overflows).sort(function(a, b) {
            return overflows[a] - overflows[b];
        });
    }
    function getExpandedFallbackPlacements(placement) {
        if (getBasePlacement(placement) === auto) {
            return [];
        }
        var oppositePlacement = getOppositePlacement(placement);
        return [ getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement) ];
    }
    function flip(_ref) {
        var state = _ref.state, options = _ref.options, name = _ref.name;
        if (state.modifiersData[name]._skip) {
            return;
        }
        var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis, specifiedFallbackPlacements = options.fallbackPlacements, padding = options.padding, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, _options$flipVariatio = options.flipVariations, flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio, allowedAutoPlacements = options.allowedAutoPlacements;
        var preferredPlacement = state.options.placement;
        var basePlacement = getBasePlacement(preferredPlacement);
        var isBasePlacement = basePlacement === preferredPlacement;
        var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [ getOppositePlacement(preferredPlacement) ] : getExpandedFallbackPlacements(preferredPlacement));
        var placements = [ preferredPlacement ].concat(fallbackPlacements).reduce(function(acc, placement) {
            return acc.concat(getBasePlacement(placement) === auto ? computeAutoPlacement(state, {
                placement: placement,
                boundary: boundary,
                rootBoundary: rootBoundary,
                padding: padding,
                flipVariations: flipVariations,
                allowedAutoPlacements: allowedAutoPlacements
            }) : placement);
        }, []);
        var referenceRect = state.rects.reference;
        var popperRect = state.rects.popper;
        var checksMap = new Map();
        var makeFallbackChecks = true;
        var firstFittingPlacement = placements[0];
        for (var i = 0; i < placements.length; i++) {
            var placement = placements[i];
            var _basePlacement = getBasePlacement(placement);
            var isStartVariation = getVariation(placement) === start;
            var isVertical = [ top, bottom ].indexOf(_basePlacement) >= 0;
            var len = isVertical ? "width" : "height";
            var overflow = detectOverflow(state, {
                placement: placement,
                boundary: boundary,
                rootBoundary: rootBoundary,
                altBoundary: altBoundary,
                padding: padding
            });
            var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;
            if (referenceRect[len] > popperRect[len]) {
                mainVariationSide = getOppositePlacement(mainVariationSide);
            }
            var altVariationSide = getOppositePlacement(mainVariationSide);
            var checks = [];
            if (checkMainAxis) {
                checks.push(overflow[_basePlacement] <= 0);
            }
            if (checkAltAxis) {
                checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
            }
            if (checks.every(function(check) {
                return check;
            })) {
                firstFittingPlacement = placement;
                makeFallbackChecks = false;
                break;
            }
            checksMap.set(placement, checks);
        }
        if (makeFallbackChecks) {
            var numberOfChecks = flipVariations ? 3 : 1;
            var _loop = function _loop(_i) {
                var fittingPlacement = placements.find(function(placement) {
                    var checks = checksMap.get(placement);
                    if (checks) {
                        return checks.slice(0, _i).every(function(check) {
                            return check;
                        });
                    }
                });
                if (fittingPlacement) {
                    firstFittingPlacement = fittingPlacement;
                    return "break";
                }
            };
            for (var _i = numberOfChecks; _i > 0; _i--) {
                var _ret = _loop(_i);
                if (_ret === "break") break;
            }
        }
        if (state.placement !== firstFittingPlacement) {
            state.modifiersData[name]._skip = true;
            state.placement = firstFittingPlacement;
            state.reset = true;
        }
    }
    const flip$1 = {
        name: "flip",
        enabled: true,
        phase: "main",
        fn: flip,
        requiresIfExists: [ "offset" ],
        data: {
            _skip: false
        }
    };
    function getSideOffsets(overflow, rect, preventedOffsets) {
        if (preventedOffsets === void 0) {
            preventedOffsets = {
                x: 0,
                y: 0
            };
        }
        return {
            top: overflow.top - rect.height - preventedOffsets.y,
            right: overflow.right - rect.width + preventedOffsets.x,
            bottom: overflow.bottom - rect.height + preventedOffsets.y,
            left: overflow.left - rect.width - preventedOffsets.x
        };
    }
    function isAnySideFullyClipped(overflow) {
        return [ top, right, bottom, left ].some(function(side) {
            return overflow[side] >= 0;
        });
    }
    function hide(_ref) {
        var state = _ref.state, name = _ref.name;
        var referenceRect = state.rects.reference;
        var popperRect = state.rects.popper;
        var preventedOffsets = state.modifiersData.preventOverflow;
        var referenceOverflow = detectOverflow(state, {
            elementContext: "reference"
        });
        var popperAltOverflow = detectOverflow(state, {
            altBoundary: true
        });
        var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
        var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
        var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
        var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
        state.modifiersData[name] = {
            referenceClippingOffsets: referenceClippingOffsets,
            popperEscapeOffsets: popperEscapeOffsets,
            isReferenceHidden: isReferenceHidden,
            hasPopperEscaped: hasPopperEscaped
        };
        state.attributes.popper = Object.assign({}, state.attributes.popper, {
            "data-popper-reference-hidden": isReferenceHidden,
            "data-popper-escaped": hasPopperEscaped
        });
    }
    const hide$1 = {
        name: "hide",
        enabled: true,
        phase: "main",
        requiresIfExists: [ "preventOverflow" ],
        fn: hide
    };
    function distanceAndSkiddingToXY(placement, rects, offset) {
        var basePlacement = getBasePlacement(placement);
        var invertDistance = [ left, top ].indexOf(basePlacement) >= 0 ? -1 : 1;
        var _ref = typeof offset === "function" ? offset(Object.assign({}, rects, {
            placement: placement
        })) : offset, skidding = _ref[0], distance = _ref[1];
        skidding = skidding || 0;
        distance = (distance || 0) * invertDistance;
        return [ left, right ].indexOf(basePlacement) >= 0 ? {
            x: distance,
            y: skidding
        } : {
            x: skidding,
            y: distance
        };
    }
    function offset(_ref2) {
        var state = _ref2.state, options = _ref2.options, name = _ref2.name;
        var _options$offset = options.offset, offset = _options$offset === void 0 ? [ 0, 0 ] : _options$offset;
        var data = placements.reduce(function(acc, placement) {
            acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset);
            return acc;
        }, {});
        var _data$state$placement = data[state.placement], x = _data$state$placement.x, y = _data$state$placement.y;
        if (state.modifiersData.popperOffsets != null) {
            state.modifiersData.popperOffsets.x += x;
            state.modifiersData.popperOffsets.y += y;
        }
        state.modifiersData[name] = data;
    }
    const offset$1 = {
        name: "offset",
        enabled: true,
        phase: "main",
        requires: [ "popperOffsets" ],
        fn: offset
    };
    function popperOffsets(_ref) {
        var state = _ref.state, name = _ref.name;
        state.modifiersData[name] = computeOffsets({
            reference: state.rects.reference,
            element: state.rects.popper,
            strategy: "absolute",
            placement: state.placement
        });
    }
    const popperOffsets$1 = {
        name: "popperOffsets",
        enabled: true,
        phase: "read",
        fn: popperOffsets,
        data: {}
    };
    function getAltAxis(axis) {
        return axis === "x" ? "y" : "x";
    }
    function preventOverflow(_ref) {
        var state = _ref.state, options = _ref.options, name = _ref.name;
        var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, padding = options.padding, _options$tether = options.tether, tether = _options$tether === void 0 ? true : _options$tether, _options$tetherOffset = options.tetherOffset, tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
        var overflow = detectOverflow(state, {
            boundary: boundary,
            rootBoundary: rootBoundary,
            padding: padding,
            altBoundary: altBoundary
        });
        var basePlacement = getBasePlacement(state.placement);
        var variation = getVariation(state.placement);
        var isBasePlacement = !variation;
        var mainAxis = getMainAxisFromPlacement(basePlacement);
        var altAxis = getAltAxis(mainAxis);
        var popperOffsets = state.modifiersData.popperOffsets;
        var referenceRect = state.rects.reference;
        var popperRect = state.rects.popper;
        var tetherOffsetValue = typeof tetherOffset === "function" ? tetherOffset(Object.assign({}, state.rects, {
            placement: state.placement
        })) : tetherOffset;
        var data = {
            x: 0,
            y: 0
        };
        if (!popperOffsets) {
            return;
        }
        if (checkMainAxis || checkAltAxis) {
            var mainSide = mainAxis === "y" ? top : left;
            var altSide = mainAxis === "y" ? bottom : right;
            var len = mainAxis === "y" ? "height" : "width";
            var offset = popperOffsets[mainAxis];
            var min$1 = popperOffsets[mainAxis] + overflow[mainSide];
            var max$1 = popperOffsets[mainAxis] - overflow[altSide];
            var additive = tether ? -popperRect[len] / 2 : 0;
            var minLen = variation === start ? referenceRect[len] : popperRect[len];
            var maxLen = variation === start ? -popperRect[len] : -referenceRect[len];
            var arrowElement = state.elements.arrow;
            var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
                width: 0,
                height: 0
            };
            var arrowPaddingObject = state.modifiersData["arrow#persistent"] ? state.modifiersData["arrow#persistent"].padding : getFreshSideObject();
            var arrowPaddingMin = arrowPaddingObject[mainSide];
            var arrowPaddingMax = arrowPaddingObject[altSide];
            var arrowLen = within(0, referenceRect[len], arrowRect[len]);
            var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - tetherOffsetValue : minLen - arrowLen - arrowPaddingMin - tetherOffsetValue;
            var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + tetherOffsetValue : maxLen + arrowLen + arrowPaddingMax + tetherOffsetValue;
            var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
            var clientOffset = arrowOffsetParent ? mainAxis === "y" ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
            var offsetModifierValue = state.modifiersData.offset ? state.modifiersData.offset[state.placement][mainAxis] : 0;
            var tetherMin = popperOffsets[mainAxis] + minOffset - offsetModifierValue - clientOffset;
            var tetherMax = popperOffsets[mainAxis] + maxOffset - offsetModifierValue;
            if (checkMainAxis) {
                var preventedOffset = within(tether ? min(min$1, tetherMin) : min$1, offset, tether ? max(max$1, tetherMax) : max$1);
                popperOffsets[mainAxis] = preventedOffset;
                data[mainAxis] = preventedOffset - offset;
            }
            if (checkAltAxis) {
                var _mainSide = mainAxis === "x" ? top : left;
                var _altSide = mainAxis === "x" ? bottom : right;
                var _offset = popperOffsets[altAxis];
                var _min = _offset + overflow[_mainSide];
                var _max = _offset - overflow[_altSide];
                var _preventedOffset = within(tether ? min(_min, tetherMin) : _min, _offset, tether ? max(_max, tetherMax) : _max);
                popperOffsets[altAxis] = _preventedOffset;
                data[altAxis] = _preventedOffset - _offset;
            }
        }
        state.modifiersData[name] = data;
    }
    const preventOverflow$1 = {
        name: "preventOverflow",
        enabled: true,
        phase: "main",
        fn: preventOverflow,
        requiresIfExists: [ "offset" ]
    };
    function getHTMLElementScroll(element) {
        return {
            scrollLeft: element.scrollLeft,
            scrollTop: element.scrollTop
        };
    }
    function getNodeScroll(node) {
        if (node === getWindow(node) || !isHTMLElement(node)) {
            return getWindowScroll(node);
        } else {
            return getHTMLElementScroll(node);
        }
    }
    function isElementScaled(element) {
        var rect = element.getBoundingClientRect();
        var scaleX = rect.width / element.offsetWidth || 1;
        var scaleY = rect.height / element.offsetHeight || 1;
        return scaleX !== 1 || scaleY !== 1;
    }
    function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
        if (isFixed === void 0) {
            isFixed = false;
        }
        var isOffsetParentAnElement = isHTMLElement(offsetParent);
        isHTMLElement(offsetParent) && isElementScaled(offsetParent);
        var documentElement = getDocumentElement(offsetParent);
        var rect = getBoundingClientRect(elementOrVirtualElement);
        var scroll = {
            scrollLeft: 0,
            scrollTop: 0
        };
        var offsets = {
            x: 0,
            y: 0
        };
        if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
            if (getNodeName(offsetParent) !== "body" || isScrollParent(documentElement)) {
                scroll = getNodeScroll(offsetParent);
            }
            if (isHTMLElement(offsetParent)) {
                offsets = getBoundingClientRect(offsetParent);
                offsets.x += offsetParent.clientLeft;
                offsets.y += offsetParent.clientTop;
            } else if (documentElement) {
                offsets.x = getWindowScrollBarX(documentElement);
            }
        }
        return {
            x: rect.left + scroll.scrollLeft - offsets.x,
            y: rect.top + scroll.scrollTop - offsets.y,
            width: rect.width,
            height: rect.height
        };
    }
    function order(modifiers) {
        var map = new Map();
        var visited = new Set();
        var result = [];
        modifiers.forEach(function(modifier) {
            map.set(modifier.name, modifier);
        });
        function sort(modifier) {
            visited.add(modifier.name);
            var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
            requires.forEach(function(dep) {
                if (!visited.has(dep)) {
                    var depModifier = map.get(dep);
                    if (depModifier) {
                        sort(depModifier);
                    }
                }
            });
            result.push(modifier);
        }
        modifiers.forEach(function(modifier) {
            if (!visited.has(modifier.name)) {
                sort(modifier);
            }
        });
        return result;
    }
    function orderModifiers(modifiers) {
        var orderedModifiers = order(modifiers);
        return modifierPhases.reduce(function(acc, phase) {
            return acc.concat(orderedModifiers.filter(function(modifier) {
                return modifier.phase === phase;
            }));
        }, []);
    }
    function debounce(fn) {
        var pending;
        return function() {
            if (!pending) {
                pending = new Promise(function(resolve) {
                    Promise.resolve().then(function() {
                        pending = undefined;
                        resolve(fn());
                    });
                });
            }
            return pending;
        };
    }
    function mergeByName(modifiers) {
        var merged = modifiers.reduce(function(merged, current) {
            var existing = merged[current.name];
            merged[current.name] = existing ? Object.assign({}, existing, current, {
                options: Object.assign({}, existing.options, current.options),
                data: Object.assign({}, existing.data, current.data)
            }) : current;
            return merged;
        }, {});
        return Object.keys(merged).map(function(key) {
            return merged[key];
        });
    }
    var DEFAULT_OPTIONS = {
        placement: "bottom",
        modifiers: [],
        strategy: "absolute"
    };
    function areValidElements() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }
        return !args.some(function(element) {
            return !(element && typeof element.getBoundingClientRect === "function");
        });
    }
    function popperGenerator(generatorOptions) {
        if (generatorOptions === void 0) {
            generatorOptions = {};
        }
        var _generatorOptions = generatorOptions, _generatorOptions$def = _generatorOptions.defaultModifiers, defaultModifiers = _generatorOptions$def === void 0 ? [] : _generatorOptions$def, _generatorOptions$def2 = _generatorOptions.defaultOptions, defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
        return function createPopper(reference, popper, options) {
            if (options === void 0) {
                options = defaultOptions;
            }
            var state = {
                placement: "bottom",
                orderedModifiers: [],
                options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
                modifiersData: {},
                elements: {
                    reference: reference,
                    popper: popper
                },
                attributes: {},
                styles: {}
            };
            var effectCleanupFns = [];
            var isDestroyed = false;
            var instance = {
                state: state,
                setOptions: function setOptions(setOptionsAction) {
                    var options = typeof setOptionsAction === "function" ? setOptionsAction(state.options) : setOptionsAction;
                    cleanupModifierEffects();
                    state.options = Object.assign({}, defaultOptions, state.options, options);
                    state.scrollParents = {
                        reference: isElement(reference) ? listScrollParents(reference) : reference.contextElement ? listScrollParents(reference.contextElement) : [],
                        popper: listScrollParents(popper)
                    };
                    var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers, state.options.modifiers)));
                    state.orderedModifiers = orderedModifiers.filter(function(m) {
                        return m.enabled;
                    });
                    runModifierEffects();
                    return instance.update();
                },
                forceUpdate: function forceUpdate() {
                    if (isDestroyed) {
                        return;
                    }
                    var _state$elements = state.elements, reference = _state$elements.reference, popper = _state$elements.popper;
                    if (!areValidElements(reference, popper)) {
                        return;
                    }
                    state.rects = {
                        reference: getCompositeRect(reference, getOffsetParent(popper), state.options.strategy === "fixed"),
                        popper: getLayoutRect(popper)
                    };
                    state.reset = false;
                    state.placement = state.options.placement;
                    state.orderedModifiers.forEach(function(modifier) {
                        return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
                    });
                    for (var index = 0; index < state.orderedModifiers.length; index++) {
                        if (state.reset === true) {
                            state.reset = false;
                            index = -1;
                            continue;
                        }
                        var _state$orderedModifie = state.orderedModifiers[index], fn = _state$orderedModifie.fn, _state$orderedModifie2 = _state$orderedModifie.options, _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2, name = _state$orderedModifie.name;
                        if (typeof fn === "function") {
                            state = fn({
                                state: state,
                                options: _options,
                                name: name,
                                instance: instance
                            }) || state;
                        }
                    }
                },
                update: debounce(function() {
                    return new Promise(function(resolve) {
                        instance.forceUpdate();
                        resolve(state);
                    });
                }),
                destroy: function destroy() {
                    cleanupModifierEffects();
                    isDestroyed = true;
                }
            };
            if (!areValidElements(reference, popper)) {
                return instance;
            }
            instance.setOptions(options).then(function(state) {
                if (!isDestroyed && options.onFirstUpdate) {
                    options.onFirstUpdate(state);
                }
            });
            function runModifierEffects() {
                state.orderedModifiers.forEach(function(_ref3) {
                    var name = _ref3.name, _ref3$options = _ref3.options, options = _ref3$options === void 0 ? {} : _ref3$options, effect = _ref3.effect;
                    if (typeof effect === "function") {
                        var cleanupFn = effect({
                            state: state,
                            name: name,
                            instance: instance,
                            options: options
                        });
                        var noopFn = function noopFn() {};
                        effectCleanupFns.push(cleanupFn || noopFn);
                    }
                });
            }
            function cleanupModifierEffects() {
                effectCleanupFns.forEach(function(fn) {
                    return fn();
                });
                effectCleanupFns = [];
            }
            return instance;
        };
    }
    var createPopper$2 = popperGenerator();
    var defaultModifiers$1 = [ eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1 ];
    var createPopper$1 = popperGenerator({
        defaultModifiers: defaultModifiers$1
    });
    var defaultModifiers = [ eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1, offset$1, flip$1, preventOverflow$1, arrow$1, hide$1 ];
    var createPopper = popperGenerator({
        defaultModifiers: defaultModifiers
    });
    const Popper = Object.freeze({
        __proto__: null,
        popperGenerator: popperGenerator,
        detectOverflow: detectOverflow,
        createPopperBase: createPopper$2,
        createPopper: createPopper,
        createPopperLite: createPopper$1,
        top: top,
        bottom: bottom,
        right: right,
        left: left,
        auto: auto,
        basePlacements: basePlacements,
        start: start,
        end: end,
        clippingParents: clippingParents,
        viewport: viewport,
        popper: popper,
        reference: reference,
        variationPlacements: variationPlacements,
        placements: placements,
        beforeRead: beforeRead,
        read: read,
        afterRead: afterRead,
        beforeMain: beforeMain,
        main: main,
        afterMain: afterMain,
        beforeWrite: beforeWrite,
        write: write,
        afterWrite: afterWrite,
        modifierPhases: modifierPhases,
        applyStyles: applyStyles$1,
        arrow: arrow$1,
        computeStyles: computeStyles$1,
        eventListeners: eventListeners,
        flip: flip$1,
        hide: hide$1,
        offset: offset$1,
        popperOffsets: popperOffsets$1,
        preventOverflow: preventOverflow$1
    });
    const NAME$9 = "dropdown";
    const DATA_KEY$8 = "bs.dropdown";
    const EVENT_KEY$8 = `.${DATA_KEY$8}`;
    const DATA_API_KEY$4 = ".data-api";
    const ESCAPE_KEY$2 = "Escape";
    const SPACE_KEY = "Space";
    const TAB_KEY$1 = "Tab";
    const ARROW_UP_KEY = "ArrowUp";
    const ARROW_DOWN_KEY = "ArrowDown";
    const RIGHT_MOUSE_BUTTON = 2;
    const REGEXP_KEYDOWN = new RegExp(`${ARROW_UP_KEY}|${ARROW_DOWN_KEY}|${ESCAPE_KEY$2}`);
    const EVENT_HIDE$4 = `hide${EVENT_KEY$8}`;
    const EVENT_HIDDEN$4 = `hidden${EVENT_KEY$8}`;
    const EVENT_SHOW$4 = `show${EVENT_KEY$8}`;
    const EVENT_SHOWN$4 = `shown${EVENT_KEY$8}`;
    const EVENT_CLICK_DATA_API$3 = `click${EVENT_KEY$8}${DATA_API_KEY$4}`;
    const EVENT_KEYDOWN_DATA_API = `keydown${EVENT_KEY$8}${DATA_API_KEY$4}`;
    const EVENT_KEYUP_DATA_API = `keyup${EVENT_KEY$8}${DATA_API_KEY$4}`;
    const CLASS_NAME_SHOW$6 = "show";
    const CLASS_NAME_DROPUP = "dropup";
    const CLASS_NAME_DROPEND = "dropend";
    const CLASS_NAME_DROPSTART = "dropstart";
    const CLASS_NAME_NAVBAR = "navbar";
    const SELECTOR_DATA_TOGGLE$3 = '[data-bs-toggle="dropdown"]';
    const SELECTOR_MENU = ".dropdown-menu";
    const SELECTOR_NAVBAR_NAV = ".navbar-nav";
    const SELECTOR_VISIBLE_ITEMS = ".dropdown-menu .dropdown-item:not(.disabled):not(:disabled)";
    const PLACEMENT_TOP = isRTL() ? "top-end" : "top-start";
    const PLACEMENT_TOPEND = isRTL() ? "top-start" : "top-end";
    const PLACEMENT_BOTTOM = isRTL() ? "bottom-end" : "bottom-start";
    const PLACEMENT_BOTTOMEND = isRTL() ? "bottom-start" : "bottom-end";
    const PLACEMENT_RIGHT = isRTL() ? "left-start" : "right-start";
    const PLACEMENT_LEFT = isRTL() ? "right-start" : "left-start";
    const Default$8 = {
        offset: [ 0, 2 ],
        boundary: "clippingParents",
        reference: "toggle",
        display: "dynamic",
        popperConfig: null,
        autoClose: true
    };
    const DefaultType$8 = {
        offset: "(array|string|function)",
        boundary: "(string|element)",
        reference: "(string|element|object)",
        display: "string",
        popperConfig: "(null|object|function)",
        autoClose: "(boolean|string)"
    };
    class Dropdown extends BaseComponent {
        constructor(element, config) {
            super(element);
            this._popper = null;
            this._config = this._getConfig(config);
            this._menu = this._getMenuElement();
            this._inNavbar = this._detectNavbar();
        }
        static get Default() {
            return Default$8;
        }
        static get DefaultType() {
            return DefaultType$8;
        }
        static get NAME() {
            return NAME$9;
        }
        toggle() {
            return this._isShown() ? this.hide() : this.show();
        }
        show() {
            if (isDisabled(this._element) || this._isShown(this._menu)) {
                return;
            }
            const relatedTarget = {
                relatedTarget: this._element
            };
            const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$4, relatedTarget);
            if (showEvent.defaultPrevented) {
                return;
            }
            const parent = Dropdown.getParentFromElement(this._element);
            if (this._inNavbar) {
                Manipulator.setDataAttribute(this._menu, "popper", "none");
            } else {
                this._createPopper(parent);
            }
            if ("ontouchstart" in document.documentElement && !parent.closest(SELECTOR_NAVBAR_NAV)) {
                [].concat(...document.body.children).forEach(elem => EventHandler.on(elem, "mouseover", noop));
            }
            this._element.focus();
            this._element.setAttribute("aria-expanded", true);
            this._menu.classList.add(CLASS_NAME_SHOW$6);
            this._element.classList.add(CLASS_NAME_SHOW$6);
            EventHandler.trigger(this._element, EVENT_SHOWN$4, relatedTarget);
        }
        hide() {
            if (isDisabled(this._element) || !this._isShown(this._menu)) {
                return;
            }
            const relatedTarget = {
                relatedTarget: this._element
            };
            this._completeHide(relatedTarget);
        }
        dispose() {
            if (this._popper) {
                this._popper.destroy();
            }
            super.dispose();
        }
        update() {
            this._inNavbar = this._detectNavbar();
            if (this._popper) {
                this._popper.update();
            }
        }
        _completeHide(relatedTarget) {
            const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$4, relatedTarget);
            if (hideEvent.defaultPrevented) {
                return;
            }
            if ("ontouchstart" in document.documentElement) {
                [].concat(...document.body.children).forEach(elem => EventHandler.off(elem, "mouseover", noop));
            }
            if (this._popper) {
                this._popper.destroy();
            }
            this._menu.classList.remove(CLASS_NAME_SHOW$6);
            this._element.classList.remove(CLASS_NAME_SHOW$6);
            this._element.setAttribute("aria-expanded", "false");
            Manipulator.removeDataAttribute(this._menu, "popper");
            EventHandler.trigger(this._element, EVENT_HIDDEN$4, relatedTarget);
        }
        _getConfig(config) {
            config = {
                ...this.constructor.Default,
                ...Manipulator.getDataAttributes(this._element),
                ...config
            };
            typeCheckConfig(NAME$9, config, this.constructor.DefaultType);
            if (typeof config.reference === "object" && !isElement$1(config.reference) && typeof config.reference.getBoundingClientRect !== "function") {
                throw new TypeError(`${NAME$9.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`);
            }
            return config;
        }
        _createPopper(parent) {
            if (typeof Popper === "undefined") {
                throw new TypeError("Bootstrap's dropdowns require Popper (https://popper.js.org)");
            }
            let referenceElement = this._element;
            if (this._config.reference === "parent") {
                referenceElement = parent;
            } else if (isElement$1(this._config.reference)) {
                referenceElement = getElement(this._config.reference);
            } else if (typeof this._config.reference === "object") {
                referenceElement = this._config.reference;
            }
            const popperConfig = this._getPopperConfig();
            const isDisplayStatic = popperConfig.modifiers.find(modifier => modifier.name === "applyStyles" && modifier.enabled === false);
            this._popper = createPopper(referenceElement, this._menu, popperConfig);
            if (isDisplayStatic) {
                Manipulator.setDataAttribute(this._menu, "popper", "static");
            }
        }
        _isShown(element = this._element) {
            return element.classList.contains(CLASS_NAME_SHOW$6);
        }
        _getMenuElement() {
            return SelectorEngine.next(this._element, SELECTOR_MENU)[0];
        }
        _getPlacement() {
            const parentDropdown = this._element.parentNode;
            if (parentDropdown.classList.contains(CLASS_NAME_DROPEND)) {
                return PLACEMENT_RIGHT;
            }
            if (parentDropdown.classList.contains(CLASS_NAME_DROPSTART)) {
                return PLACEMENT_LEFT;
            }
            const isEnd = getComputedStyle(this._menu).getPropertyValue("--bs-position").trim() === "end";
            if (parentDropdown.classList.contains(CLASS_NAME_DROPUP)) {
                return isEnd ? PLACEMENT_TOPEND : PLACEMENT_TOP;
            }
            return isEnd ? PLACEMENT_BOTTOMEND : PLACEMENT_BOTTOM;
        }
        _detectNavbar() {
            return this._element.closest(`.${CLASS_NAME_NAVBAR}`) !== null;
        }
        _getOffset() {
            const {
                offset
            } = this._config;
            if (typeof offset === "string") {
                return offset.split(",").map(val => Number.parseInt(val, 10));
            }
            if (typeof offset === "function") {
                return popperData => offset(popperData, this._element);
            }
            return offset;
        }
        _getPopperConfig() {
            const defaultBsPopperConfig = {
                placement: this._getPlacement(),
                modifiers: [ {
                    name: "preventOverflow",
                    options: {
                        boundary: this._config.boundary
                    }
                }, {
                    name: "offset",
                    options: {
                        offset: this._getOffset()
                    }
                } ]
            };
            if (this._config.display === "static") {
                defaultBsPopperConfig.modifiers = [ {
                    name: "applyStyles",
                    enabled: false
                } ];
            }
            return {
                ...defaultBsPopperConfig,
                ...typeof this._config.popperConfig === "function" ? this._config.popperConfig(defaultBsPopperConfig) : this._config.popperConfig
            };
        }
        _selectMenuItem({
            key,
            target
        }) {
            const items = SelectorEngine.find(SELECTOR_VISIBLE_ITEMS, this._menu).filter(isVisible);
            if (!items.length) {
                return;
            }
            getNextActiveElement(items, target, key === ARROW_DOWN_KEY, !items.includes(target)).focus();
        }
        static jQueryInterface(config) {
            return this.each(function() {
                const data = Dropdown.getOrCreateInstance(this, config);
                if (typeof config !== "string") {
                    return;
                }
                if (typeof data[config] === "undefined") {
                    throw new TypeError(`No method named "${config}"`);
                }
                data[config]();
            });
        }
        static clearMenus(event) {
            if (event && (event.button === RIGHT_MOUSE_BUTTON || event.type === "keyup" && event.key !== TAB_KEY$1)) {
                return;
            }
            const toggles = SelectorEngine.find(SELECTOR_DATA_TOGGLE$3);
            for (let i = 0, len = toggles.length; i < len; i++) {
                const context = Dropdown.getInstance(toggles[i]);
                if (!context || context._config.autoClose === false) {
                    continue;
                }
                if (!context._isShown()) {
                    continue;
                }
                const relatedTarget = {
                    relatedTarget: context._element
                };
                if (event) {
                    const composedPath = event.composedPath();
                    const isMenuTarget = composedPath.includes(context._menu);
                    if (composedPath.includes(context._element) || context._config.autoClose === "inside" && !isMenuTarget || context._config.autoClose === "outside" && isMenuTarget) {
                        continue;
                    }
                    if (context._menu.contains(event.target) && (event.type === "keyup" && event.key === TAB_KEY$1 || /input|select|option|textarea|form/i.test(event.target.tagName))) {
                        continue;
                    }
                    if (event.type === "click") {
                        relatedTarget.clickEvent = event;
                    }
                }
                context._completeHide(relatedTarget);
            }
        }
        static getParentFromElement(element) {
            return getElementFromSelector(element) || element.parentNode;
        }
        static dataApiKeydownHandler(event) {
            if (/input|textarea/i.test(event.target.tagName) ? event.key === SPACE_KEY || event.key !== ESCAPE_KEY$2 && (event.key !== ARROW_DOWN_KEY && event.key !== ARROW_UP_KEY || event.target.closest(SELECTOR_MENU)) : !REGEXP_KEYDOWN.test(event.key)) {
                return;
            }
            const isActive = this.classList.contains(CLASS_NAME_SHOW$6);
            if (!isActive && event.key === ESCAPE_KEY$2) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (isDisabled(this)) {
                return;
            }
            const getToggleButton = this.matches(SELECTOR_DATA_TOGGLE$3) ? this : SelectorEngine.prev(this, SELECTOR_DATA_TOGGLE$3)[0];
            const instance = Dropdown.getOrCreateInstance(getToggleButton);
            if (event.key === ESCAPE_KEY$2) {
                instance.hide();
                return;
            }
            if (event.key === ARROW_UP_KEY || event.key === ARROW_DOWN_KEY) {
                if (!isActive) {
                    instance.show();
                }
                instance._selectMenuItem(event);
                return;
            }
            if (!isActive || event.key === SPACE_KEY) {
                Dropdown.clearMenus();
            }
        }
    }
    EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_DATA_TOGGLE$3, Dropdown.dataApiKeydownHandler);
    EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_MENU, Dropdown.dataApiKeydownHandler);
    EventHandler.on(document, EVENT_CLICK_DATA_API$3, Dropdown.clearMenus);
    EventHandler.on(document, EVENT_KEYUP_DATA_API, Dropdown.clearMenus);
    EventHandler.on(document, EVENT_CLICK_DATA_API$3, SELECTOR_DATA_TOGGLE$3, function(event) {
        event.preventDefault();
        Dropdown.getOrCreateInstance(this).toggle();
    });
    defineJQueryPlugin(Dropdown);
    const SELECTOR_FIXED_CONTENT = ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top";
    const SELECTOR_STICKY_CONTENT = ".sticky-top";
    class ScrollBarHelper {
        constructor() {
            this._element = document.body;
        }
        getWidth() {
            const documentWidth = document.documentElement.clientWidth;
            return Math.abs(window.innerWidth - documentWidth);
        }
        hide() {
            const width = this.getWidth();
            this._disableOverFlow();
            this._setElementAttributes(this._element, "paddingRight", calculatedValue => calculatedValue + width);
            this._setElementAttributes(SELECTOR_FIXED_CONTENT, "paddingRight", calculatedValue => calculatedValue + width);
            this._setElementAttributes(SELECTOR_STICKY_CONTENT, "marginRight", calculatedValue => calculatedValue - width);
        }
        _disableOverFlow() {
            this._saveInitialAttribute(this._element, "overflow");
            this._element.style.overflow = "hidden";
        }
        _setElementAttributes(selector, styleProp, callback) {
            const scrollbarWidth = this.getWidth();
            const manipulationCallBack = element => {
                if (element !== this._element && window.innerWidth > element.clientWidth + scrollbarWidth) {
                    return;
                }
                this._saveInitialAttribute(element, styleProp);
                const calculatedValue = window.getComputedStyle(element)[styleProp];
                element.style[styleProp] = `${callback(Number.parseFloat(calculatedValue))}px`;
            };
            this._applyManipulationCallback(selector, manipulationCallBack);
        }
        reset() {
            this._resetElementAttributes(this._element, "overflow");
            this._resetElementAttributes(this._element, "paddingRight");
            this._resetElementAttributes(SELECTOR_FIXED_CONTENT, "paddingRight");
            this._resetElementAttributes(SELECTOR_STICKY_CONTENT, "marginRight");
        }
        _saveInitialAttribute(element, styleProp) {
            const actualValue = element.style[styleProp];
            if (actualValue) {
                Manipulator.setDataAttribute(element, styleProp, actualValue);
            }
        }
        _resetElementAttributes(selector, styleProp) {
            const manipulationCallBack = element => {
                const value = Manipulator.getDataAttribute(element, styleProp);
                if (typeof value === "undefined") {
                    element.style.removeProperty(styleProp);
                } else {
                    Manipulator.removeDataAttribute(element, styleProp);
                    element.style[styleProp] = value;
                }
            };
            this._applyManipulationCallback(selector, manipulationCallBack);
        }
        _applyManipulationCallback(selector, callBack) {
            if (isElement$1(selector)) {
                callBack(selector);
            } else {
                SelectorEngine.find(selector, this._element).forEach(callBack);
            }
        }
        isOverflowing() {
            return this.getWidth() > 0;
        }
    }
    const Default$7 = {
        className: "modal-backdrop",
        isVisible: true,
        isAnimated: false,
        rootElement: "body",
        clickCallback: null
    };
    const DefaultType$7 = {
        className: "string",
        isVisible: "boolean",
        isAnimated: "boolean",
        rootElement: "(element|string)",
        clickCallback: "(function|null)"
    };
    const NAME$8 = "backdrop";
    const CLASS_NAME_FADE$4 = "fade";
    const CLASS_NAME_SHOW$5 = "show";
    const EVENT_MOUSEDOWN = `mousedown.bs.${NAME$8}`;
    class Backdrop {
        constructor(config) {
            this._config = this._getConfig(config);
            this._isAppended = false;
            this._element = null;
        }
        show(callback) {
            if (!this._config.isVisible) {
                execute(callback);
                return;
            }
            this._append();
            if (this._config.isAnimated) {
                reflow(this._getElement());
            }
            this._getElement().classList.add(CLASS_NAME_SHOW$5);
            this._emulateAnimation(() => {
                execute(callback);
            });
        }
        hide(callback) {
            if (!this._config.isVisible) {
                execute(callback);
                return;
            }
            this._getElement().classList.remove(CLASS_NAME_SHOW$5);
            this._emulateAnimation(() => {
                this.dispose();
                execute(callback);
            });
        }
        _getElement() {
            if (!this._element) {
                const backdrop = document.createElement("div");
                backdrop.className = this._config.className;
                if (this._config.isAnimated) {
                    backdrop.classList.add(CLASS_NAME_FADE$4);
                }
                this._element = backdrop;
            }
            return this._element;
        }
        _getConfig(config) {
            config = {
                ...Default$7,
                ...typeof config === "object" ? config : {}
            };
            config.rootElement = getElement(config.rootElement);
            typeCheckConfig(NAME$8, config, DefaultType$7);
            return config;
        }
        _append() {
            if (this._isAppended) {
                return;
            }
            this._config.rootElement.append(this._getElement());
            EventHandler.on(this._getElement(), EVENT_MOUSEDOWN, () => {
                execute(this._config.clickCallback);
            });
            this._isAppended = true;
        }
        dispose() {
            if (!this._isAppended) {
                return;
            }
            EventHandler.off(this._element, EVENT_MOUSEDOWN);
            this._element.remove();
            this._isAppended = false;
        }
        _emulateAnimation(callback) {
            executeAfterTransition(callback, this._getElement(), this._config.isAnimated);
        }
    }
    const Default$6 = {
        trapElement: null,
        autofocus: true
    };
    const DefaultType$6 = {
        trapElement: "element",
        autofocus: "boolean"
    };
    const NAME$7 = "focustrap";
    const DATA_KEY$7 = "bs.focustrap";
    const EVENT_KEY$7 = `.${DATA_KEY$7}`;
    const EVENT_FOCUSIN$1 = `focusin${EVENT_KEY$7}`;
    const EVENT_KEYDOWN_TAB = `keydown.tab${EVENT_KEY$7}`;
    const TAB_KEY = "Tab";
    const TAB_NAV_FORWARD = "forward";
    const TAB_NAV_BACKWARD = "backward";
    class FocusTrap {
        constructor(config) {
            this._config = this._getConfig(config);
            this._isActive = false;
            this._lastTabNavDirection = null;
        }
        activate() {
            const {
                trapElement,
                autofocus
            } = this._config;
            if (this._isActive) {
                return;
            }
            if (autofocus) {
                trapElement.focus();
            }
            EventHandler.off(document, EVENT_KEY$7);
            EventHandler.on(document, EVENT_FOCUSIN$1, event => this._handleFocusin(event));
            EventHandler.on(document, EVENT_KEYDOWN_TAB, event => this._handleKeydown(event));
            this._isActive = true;
        }
        deactivate() {
            if (!this._isActive) {
                return;
            }
            this._isActive = false;
            EventHandler.off(document, EVENT_KEY$7);
        }
        _handleFocusin(event) {
            const {
                target
            } = event;
            const {
                trapElement
            } = this._config;
            if (target === document || target === trapElement || trapElement.contains(target)) {
                return;
            }
            const elements = SelectorEngine.focusableChildren(trapElement);
            if (elements.length === 0) {
                trapElement.focus();
            } else if (this._lastTabNavDirection === TAB_NAV_BACKWARD) {
                elements[elements.length - 1].focus();
            } else {
                elements[0].focus();
            }
        }
        _handleKeydown(event) {
            if (event.key !== TAB_KEY) {
                return;
            }
            this._lastTabNavDirection = event.shiftKey ? TAB_NAV_BACKWARD : TAB_NAV_FORWARD;
        }
        _getConfig(config) {
            config = {
                ...Default$6,
                ...typeof config === "object" ? config : {}
            };
            typeCheckConfig(NAME$7, config, DefaultType$6);
            return config;
        }
    }
    const NAME$6 = "modal";
    const DATA_KEY$6 = "bs.modal";
    const EVENT_KEY$6 = `.${DATA_KEY$6}`;
    const DATA_API_KEY$3 = ".data-api";
    const ESCAPE_KEY$1 = "Escape";
    const Default$5 = {
        backdrop: true,
        keyboard: true,
        focus: true
    };
    const DefaultType$5 = {
        backdrop: "(boolean|string)",
        keyboard: "boolean",
        focus: "boolean"
    };
    const EVENT_HIDE$3 = `hide${EVENT_KEY$6}`;
    const EVENT_HIDE_PREVENTED = `hidePrevented${EVENT_KEY$6}`;
    const EVENT_HIDDEN$3 = `hidden${EVENT_KEY$6}`;
    const EVENT_SHOW$3 = `show${EVENT_KEY$6}`;
    const EVENT_SHOWN$3 = `shown${EVENT_KEY$6}`;
    const EVENT_RESIZE = `resize${EVENT_KEY$6}`;
    const EVENT_CLICK_DISMISS = `click.dismiss${EVENT_KEY$6}`;
    const EVENT_KEYDOWN_DISMISS$1 = `keydown.dismiss${EVENT_KEY$6}`;
    const EVENT_MOUSEUP_DISMISS = `mouseup.dismiss${EVENT_KEY$6}`;
    const EVENT_MOUSEDOWN_DISMISS = `mousedown.dismiss${EVENT_KEY$6}`;
    const EVENT_CLICK_DATA_API$2 = `click${EVENT_KEY$6}${DATA_API_KEY$3}`;
    const CLASS_NAME_OPEN = "modal-open";
    const CLASS_NAME_FADE$3 = "fade";
    const CLASS_NAME_SHOW$4 = "show";
    const CLASS_NAME_STATIC = "modal-static";
    const OPEN_SELECTOR$1 = ".modal.show";
    const SELECTOR_DIALOG = ".modal-dialog";
    const SELECTOR_MODAL_BODY = ".modal-body";
    const SELECTOR_DATA_TOGGLE$2 = '[data-bs-toggle="modal"]';
    class Modal extends BaseComponent {
        constructor(element, config) {
            super(element);
            this._config = this._getConfig(config);
            this._dialog = SelectorEngine.findOne(SELECTOR_DIALOG, this._element);
            this._backdrop = this._initializeBackDrop();
            this._focustrap = this._initializeFocusTrap();
            this._isShown = false;
            this._ignoreBackdropClick = false;
            this._isTransitioning = false;
            this._scrollBar = new ScrollBarHelper();
        }
        static get Default() {
            return Default$5;
        }
        static get NAME() {
            return NAME$6;
        }
        toggle(relatedTarget) {
            return this._isShown ? this.hide() : this.show(relatedTarget);
        }
        show(relatedTarget) {
            if (this._isShown || this._isTransitioning) {
                return;
            }
            const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$3, {
                relatedTarget: relatedTarget
            });
            if (showEvent.defaultPrevented) {
                return;
            }
            this._isShown = true;
            if (this._isAnimated()) {
                this._isTransitioning = true;
            }
            this._scrollBar.hide();
            document.body.classList.add(CLASS_NAME_OPEN);
            this._adjustDialog();
            this._setEscapeEvent();
            this._setResizeEvent();
            EventHandler.on(this._dialog, EVENT_MOUSEDOWN_DISMISS, () => {
                EventHandler.one(this._element, EVENT_MOUSEUP_DISMISS, event => {
                    if (event.target === this._element) {
                        this._ignoreBackdropClick = true;
                    }
                });
            });
            this._showBackdrop(() => this._showElement(relatedTarget));
        }
        hide() {
            if (!this._isShown || this._isTransitioning) {
                return;
            }
            const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$3);
            if (hideEvent.defaultPrevented) {
                return;
            }
            this._isShown = false;
            const isAnimated = this._isAnimated();
            if (isAnimated) {
                this._isTransitioning = true;
            }
            this._setEscapeEvent();
            this._setResizeEvent();
            this._focustrap.deactivate();
            this._element.classList.remove(CLASS_NAME_SHOW$4);
            EventHandler.off(this._element, EVENT_CLICK_DISMISS);
            EventHandler.off(this._dialog, EVENT_MOUSEDOWN_DISMISS);
            this._queueCallback(() => this._hideModal(), this._element, isAnimated);
        }
        dispose() {
            [ window, this._dialog ].forEach(htmlElement => EventHandler.off(htmlElement, EVENT_KEY$6));
            this._backdrop.dispose();
            this._focustrap.deactivate();
            super.dispose();
        }
        handleUpdate() {
            this._adjustDialog();
        }
        _initializeBackDrop() {
            return new Backdrop({
                isVisible: Boolean(this._config.backdrop),
                isAnimated: this._isAnimated()
            });
        }
        _initializeFocusTrap() {
            return new FocusTrap({
                trapElement: this._element
            });
        }
        _getConfig(config) {
            config = {
                ...Default$5,
                ...Manipulator.getDataAttributes(this._element),
                ...typeof config === "object" ? config : {}
            };
            typeCheckConfig(NAME$6, config, DefaultType$5);
            return config;
        }
        _showElement(relatedTarget) {
            const isAnimated = this._isAnimated();
            const modalBody = SelectorEngine.findOne(SELECTOR_MODAL_BODY, this._dialog);
            if (!this._element.parentNode || this._element.parentNode.nodeType !== Node.ELEMENT_NODE) {
                document.body.append(this._element);
            }
            this._element.style.display = "block";
            this._element.removeAttribute("aria-hidden");
            this._element.setAttribute("aria-modal", true);
            this._element.setAttribute("role", "dialog");
            this._element.scrollTop = 0;
            if (modalBody) {
                modalBody.scrollTop = 0;
            }
            if (isAnimated) {
                reflow(this._element);
            }
            this._element.classList.add(CLASS_NAME_SHOW$4);
            const transitionComplete = () => {
                if (this._config.focus) {
                    this._focustrap.activate();
                }
                this._isTransitioning = false;
                EventHandler.trigger(this._element, EVENT_SHOWN$3, {
                    relatedTarget: relatedTarget
                });
            };
            this._queueCallback(transitionComplete, this._dialog, isAnimated);
        }
        _setEscapeEvent() {
            if (this._isShown) {
                EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS$1, event => {
                    if (this._config.keyboard && event.key === ESCAPE_KEY$1) {
                        event.preventDefault();
                        this.hide();
                    } else if (!this._config.keyboard && event.key === ESCAPE_KEY$1) {
                        this._triggerBackdropTransition();
                    }
                });
            } else {
                EventHandler.off(this._element, EVENT_KEYDOWN_DISMISS$1);
            }
        }
        _setResizeEvent() {
            if (this._isShown) {
                EventHandler.on(window, EVENT_RESIZE, () => this._adjustDialog());
            } else {
                EventHandler.off(window, EVENT_RESIZE);
            }
        }
        _hideModal() {
            this._element.style.display = "none";
            this._element.setAttribute("aria-hidden", true);
            this._element.removeAttribute("aria-modal");
            this._element.removeAttribute("role");
            this._isTransitioning = false;
            this._backdrop.hide(() => {
                document.body.classList.remove(CLASS_NAME_OPEN);
                this._resetAdjustments();
                this._scrollBar.reset();
                EventHandler.trigger(this._element, EVENT_HIDDEN$3);
            });
        }
        _showBackdrop(callback) {
            EventHandler.on(this._element, EVENT_CLICK_DISMISS, event => {
                if (this._ignoreBackdropClick) {
                    this._ignoreBackdropClick = false;
                    return;
                }
                if (event.target !== event.currentTarget) {
                    return;
                }
                if (this._config.backdrop === true) {
                    this.hide();
                } else if (this._config.backdrop === "static") {
                    this._triggerBackdropTransition();
                }
            });
            this._backdrop.show(callback);
        }
        _isAnimated() {
            return this._element.classList.contains(CLASS_NAME_FADE$3);
        }
        _triggerBackdropTransition() {
            const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED);
            if (hideEvent.defaultPrevented) {
                return;
            }
            const {
                classList,
                scrollHeight,
                style
            } = this._element;
            const isModalOverflowing = scrollHeight > document.documentElement.clientHeight;
            if (!isModalOverflowing && style.overflowY === "hidden" || classList.contains(CLASS_NAME_STATIC)) {
                return;
            }
            if (!isModalOverflowing) {
                style.overflowY = "hidden";
            }
            classList.add(CLASS_NAME_STATIC);
            this._queueCallback(() => {
                classList.remove(CLASS_NAME_STATIC);
                if (!isModalOverflowing) {
                    this._queueCallback(() => {
                        style.overflowY = "";
                    }, this._dialog);
                }
            }, this._dialog);
            this._element.focus();
        }
        _adjustDialog() {
            const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
            const scrollbarWidth = this._scrollBar.getWidth();
            const isBodyOverflowing = scrollbarWidth > 0;
            if (!isBodyOverflowing && isModalOverflowing && !isRTL() || isBodyOverflowing && !isModalOverflowing && isRTL()) {
                this._element.style.paddingLeft = `${scrollbarWidth}px`;
            }
            if (isBodyOverflowing && !isModalOverflowing && !isRTL() || !isBodyOverflowing && isModalOverflowing && isRTL()) {
                this._element.style.paddingRight = `${scrollbarWidth}px`;
            }
        }
        _resetAdjustments() {
            this._element.style.paddingLeft = "";
            this._element.style.paddingRight = "";
        }
        static jQueryInterface(config, relatedTarget) {
            return this.each(function() {
                const data = Modal.getOrCreateInstance(this, config);
                if (typeof config !== "string") {
                    return;
                }
                if (typeof data[config] === "undefined") {
                    throw new TypeError(`No method named "${config}"`);
                }
                data[config](relatedTarget);
            });
        }
    }
    EventHandler.on(document, EVENT_CLICK_DATA_API$2, SELECTOR_DATA_TOGGLE$2, function(event) {
        const target = getElementFromSelector(this);
        if ([ "A", "AREA" ].includes(this.tagName)) {
            event.preventDefault();
        }
        EventHandler.one(target, EVENT_SHOW$3, showEvent => {
            if (showEvent.defaultPrevented) {
                return;
            }
            EventHandler.one(target, EVENT_HIDDEN$3, () => {
                if (isVisible(this)) {
                    this.focus();
                }
            });
        });
        const allReadyOpen = SelectorEngine.findOne(OPEN_SELECTOR$1);
        if (allReadyOpen) {
            Modal.getInstance(allReadyOpen).hide();
        }
        const data = Modal.getOrCreateInstance(target);
        data.toggle(this);
    });
    enableDismissTrigger(Modal);
    defineJQueryPlugin(Modal);
    const NAME$5 = "offcanvas";
    const DATA_KEY$5 = "bs.offcanvas";
    const EVENT_KEY$5 = `.${DATA_KEY$5}`;
    const DATA_API_KEY$2 = ".data-api";
    const EVENT_LOAD_DATA_API$1 = `load${EVENT_KEY$5}${DATA_API_KEY$2}`;
    const ESCAPE_KEY = "Escape";
    const Default$4 = {
        backdrop: true,
        keyboard: true,
        scroll: false
    };
    const DefaultType$4 = {
        backdrop: "boolean",
        keyboard: "boolean",
        scroll: "boolean"
    };
    const CLASS_NAME_SHOW$3 = "show";
    const CLASS_NAME_BACKDROP = "offcanvas-backdrop";
    const OPEN_SELECTOR = ".offcanvas.show";
    const EVENT_SHOW$2 = `show${EVENT_KEY$5}`;
    const EVENT_SHOWN$2 = `shown${EVENT_KEY$5}`;
    const EVENT_HIDE$2 = `hide${EVENT_KEY$5}`;
    const EVENT_HIDDEN$2 = `hidden${EVENT_KEY$5}`;
    const EVENT_CLICK_DATA_API$1 = `click${EVENT_KEY$5}${DATA_API_KEY$2}`;
    const EVENT_KEYDOWN_DISMISS = `keydown.dismiss${EVENT_KEY$5}`;
    const SELECTOR_DATA_TOGGLE$1 = '[data-bs-toggle="offcanvas"]';
    class Offcanvas extends BaseComponent {
        constructor(element, config) {
            super(element);
            this._config = this._getConfig(config);
            this._isShown = false;
            this._backdrop = this._initializeBackDrop();
            this._focustrap = this._initializeFocusTrap();
            this._addEventListeners();
        }
        static get NAME() {
            return NAME$5;
        }
        static get Default() {
            return Default$4;
        }
        toggle(relatedTarget) {
            return this._isShown ? this.hide() : this.show(relatedTarget);
        }
        show(relatedTarget) {
            if (this._isShown) {
                return;
            }
            const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$2, {
                relatedTarget: relatedTarget
            });
            if (showEvent.defaultPrevented) {
                return;
            }
            this._isShown = true;
            this._element.style.visibility = "visible";
            this._backdrop.show();
            if (!this._config.scroll) {
                new ScrollBarHelper().hide();
            }
            this._element.removeAttribute("aria-hidden");
            this._element.setAttribute("aria-modal", true);
            this._element.setAttribute("role", "dialog");
            this._element.classList.add(CLASS_NAME_SHOW$3);
            const completeCallBack = () => {
                if (!this._config.scroll) {
                    this._focustrap.activate();
                }
                EventHandler.trigger(this._element, EVENT_SHOWN$2, {
                    relatedTarget: relatedTarget
                });
            };
            this._queueCallback(completeCallBack, this._element, true);
        }
        hide() {
            if (!this._isShown) {
                return;
            }
            const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$2);
            if (hideEvent.defaultPrevented) {
                return;
            }
            this._focustrap.deactivate();
            this._element.blur();
            this._isShown = false;
            this._element.classList.remove(CLASS_NAME_SHOW$3);
            this._backdrop.hide();
            const completeCallback = () => {
                this._element.setAttribute("aria-hidden", true);
                this._element.removeAttribute("aria-modal");
                this._element.removeAttribute("role");
                this._element.style.visibility = "hidden";
                if (!this._config.scroll) {
                    new ScrollBarHelper().reset();
                }
                EventHandler.trigger(this._element, EVENT_HIDDEN$2);
            };
            this._queueCallback(completeCallback, this._element, true);
        }
        dispose() {
            this._backdrop.dispose();
            this._focustrap.deactivate();
            super.dispose();
        }
        _getConfig(config) {
            config = {
                ...Default$4,
                ...Manipulator.getDataAttributes(this._element),
                ...typeof config === "object" ? config : {}
            };
            typeCheckConfig(NAME$5, config, DefaultType$4);
            return config;
        }
        _initializeBackDrop() {
            return new Backdrop({
                className: CLASS_NAME_BACKDROP,
                isVisible: this._config.backdrop,
                isAnimated: true,
                rootElement: this._element.parentNode,
                clickCallback: () => this.hide()
            });
        }
        _initializeFocusTrap() {
            return new FocusTrap({
                trapElement: this._element
            });
        }
        _addEventListeners() {
            EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS, event => {
                if (this._config.keyboard && event.key === ESCAPE_KEY) {
                    this.hide();
                }
            });
        }
        static jQueryInterface(config) {
            return this.each(function() {
                const data = Offcanvas.getOrCreateInstance(this, config);
                if (typeof config !== "string") {
                    return;
                }
                if (data[config] === undefined || config.startsWith("_") || config === "constructor") {
                    throw new TypeError(`No method named "${config}"`);
                }
                data[config](this);
            });
        }
    }
    EventHandler.on(document, EVENT_CLICK_DATA_API$1, SELECTOR_DATA_TOGGLE$1, function(event) {
        const target = getElementFromSelector(this);
        if ([ "A", "AREA" ].includes(this.tagName)) {
            event.preventDefault();
        }
        if (isDisabled(this)) {
            return;
        }
        EventHandler.one(target, EVENT_HIDDEN$2, () => {
            if (isVisible(this)) {
                this.focus();
            }
        });
        const allReadyOpen = SelectorEngine.findOne(OPEN_SELECTOR);
        if (allReadyOpen && allReadyOpen !== target) {
            Offcanvas.getInstance(allReadyOpen).hide();
        }
        const data = Offcanvas.getOrCreateInstance(target);
        data.toggle(this);
    });
    EventHandler.on(window, EVENT_LOAD_DATA_API$1, () => SelectorEngine.find(OPEN_SELECTOR).forEach(el => Offcanvas.getOrCreateInstance(el).show()));
    enableDismissTrigger(Offcanvas);
    defineJQueryPlugin(Offcanvas);
    const uriAttributes = new Set([ "background", "cite", "href", "itemtype", "longdesc", "poster", "src", "xlink:href" ]);
    const ARIA_ATTRIBUTE_PATTERN = /^aria-[\w-]*$/i;
    const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file|sms):|[^#&/:?]*(?:[#/?]|$))/i;
    const DATA_URL_PATTERN = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[\d+/a-z]+=*$/i;
    const allowedAttribute = (attribute, allowedAttributeList) => {
        const attributeName = attribute.nodeName.toLowerCase();
        if (allowedAttributeList.includes(attributeName)) {
            if (uriAttributes.has(attributeName)) {
                return Boolean(SAFE_URL_PATTERN.test(attribute.nodeValue) || DATA_URL_PATTERN.test(attribute.nodeValue));
            }
            return true;
        }
        const regExp = allowedAttributeList.filter(attributeRegex => attributeRegex instanceof RegExp);
        for (let i = 0, len = regExp.length; i < len; i++) {
            if (regExp[i].test(attributeName)) {
                return true;
            }
        }
        return false;
    };
    const DefaultAllowlist = {
        "*": [ "class", "dir", "id", "lang", "role", ARIA_ATTRIBUTE_PATTERN ],
        a: [ "target", "href", "title", "rel" ],
        area: [],
        b: [],
        br: [],
        col: [],
        code: [],
        div: [],
        em: [],
        hr: [],
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: [],
        i: [],
        img: [ "src", "srcset", "alt", "title", "width", "height" ],
        li: [],
        ol: [],
        p: [],
        pre: [],
        s: [],
        small: [],
        span: [],
        sub: [],
        sup: [],
        strong: [],
        u: [],
        ul: []
    };
    function sanitizeHtml(unsafeHtml, allowList, sanitizeFn) {
        if (!unsafeHtml.length) {
            return unsafeHtml;
        }
        if (sanitizeFn && typeof sanitizeFn === "function") {
            return sanitizeFn(unsafeHtml);
        }
        const domParser = new window.DOMParser();
        const createdDocument = domParser.parseFromString(unsafeHtml, "text/html");
        const elements = [].concat(...createdDocument.body.querySelectorAll("*"));
        for (let i = 0, len = elements.length; i < len; i++) {
            const element = elements[i];
            const elementName = element.nodeName.toLowerCase();
            if (!Object.keys(allowList).includes(elementName)) {
                element.remove();
                continue;
            }
            const attributeList = [].concat(...element.attributes);
            const allowedAttributes = [].concat(allowList["*"] || [], allowList[elementName] || []);
            attributeList.forEach(attribute => {
                if (!allowedAttribute(attribute, allowedAttributes)) {
                    element.removeAttribute(attribute.nodeName);
                }
            });
        }
        return createdDocument.body.innerHTML;
    }
    const NAME$4 = "tooltip";
    const DATA_KEY$4 = "bs.tooltip";
    const EVENT_KEY$4 = `.${DATA_KEY$4}`;
    const CLASS_PREFIX$1 = "bs-tooltip";
    const DISALLOWED_ATTRIBUTES = new Set([ "sanitize", "allowList", "sanitizeFn" ]);
    const DefaultType$3 = {
        animation: "boolean",
        template: "string",
        title: "(string|element|function)",
        trigger: "string",
        delay: "(number|object)",
        html: "boolean",
        selector: "(string|boolean)",
        placement: "(string|function)",
        offset: "(array|string|function)",
        container: "(string|element|boolean)",
        fallbackPlacements: "array",
        boundary: "(string|element)",
        customClass: "(string|function)",
        sanitize: "boolean",
        sanitizeFn: "(null|function)",
        allowList: "object",
        popperConfig: "(null|object|function)"
    };
    const AttachmentMap = {
        AUTO: "auto",
        TOP: "top",
        RIGHT: isRTL() ? "left" : "right",
        BOTTOM: "bottom",
        LEFT: isRTL() ? "right" : "left"
    };
    const Default$3 = {
        animation: true,
        template: '<div class="tooltip" role="tooltip">' + '<div class="tooltip-arrow"></div>' + '<div class="tooltip-inner"></div>' + "</div>",
        trigger: "hover focus",
        title: "",
        delay: 0,
        html: false,
        selector: false,
        placement: "top",
        offset: [ 0, 0 ],
        container: false,
        fallbackPlacements: [ "top", "right", "bottom", "left" ],
        boundary: "clippingParents",
        customClass: "",
        sanitize: true,
        sanitizeFn: null,
        allowList: DefaultAllowlist,
        popperConfig: null
    };
    const Event$2 = {
        HIDE: `hide${EVENT_KEY$4}`,
        HIDDEN: `hidden${EVENT_KEY$4}`,
        SHOW: `show${EVENT_KEY$4}`,
        SHOWN: `shown${EVENT_KEY$4}`,
        INSERTED: `inserted${EVENT_KEY$4}`,
        CLICK: `click${EVENT_KEY$4}`,
        FOCUSIN: `focusin${EVENT_KEY$4}`,
        FOCUSOUT: `focusout${EVENT_KEY$4}`,
        MOUSEENTER: `mouseenter${EVENT_KEY$4}`,
        MOUSELEAVE: `mouseleave${EVENT_KEY$4}`
    };
    const CLASS_NAME_FADE$2 = "fade";
    const CLASS_NAME_MODAL = "modal";
    const CLASS_NAME_SHOW$2 = "show";
    const HOVER_STATE_SHOW = "show";
    const HOVER_STATE_OUT = "out";
    const SELECTOR_TOOLTIP_INNER = ".tooltip-inner";
    const SELECTOR_MODAL = `.${CLASS_NAME_MODAL}`;
    const EVENT_MODAL_HIDE = "hide.bs.modal";
    const TRIGGER_HOVER = "hover";
    const TRIGGER_FOCUS = "focus";
    const TRIGGER_CLICK = "click";
    const TRIGGER_MANUAL = "manual";
    class Tooltip extends BaseComponent {
        constructor(element, config) {
            if (typeof Popper === "undefined") {
                throw new TypeError("Bootstrap's tooltips require Popper (https://popper.js.org)");
            }
            super(element);
            this._isEnabled = true;
            this._timeout = 0;
            this._hoverState = "";
            this._activeTrigger = {};
            this._popper = null;
            this._config = this._getConfig(config);
            this.tip = null;
            this._setListeners();
        }
        static get Default() {
            return Default$3;
        }
        static get NAME() {
            return NAME$4;
        }
        static get Event() {
            return Event$2;
        }
        static get DefaultType() {
            return DefaultType$3;
        }
        enable() {
            this._isEnabled = true;
        }
        disable() {
            this._isEnabled = false;
        }
        toggleEnabled() {
            this._isEnabled = !this._isEnabled;
        }
        toggle(event) {
            if (!this._isEnabled) {
                return;
            }
            if (event) {
                const context = this._initializeOnDelegatedTarget(event);
                context._activeTrigger.click = !context._activeTrigger.click;
                if (context._isWithActiveTrigger()) {
                    context._enter(null, context);
                } else {
                    context._leave(null, context);
                }
            } else {
                if (this.getTipElement().classList.contains(CLASS_NAME_SHOW$2)) {
                    this._leave(null, this);
                    return;
                }
                this._enter(null, this);
            }
        }
        dispose() {
            clearTimeout(this._timeout);
            EventHandler.off(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
            if (this.tip) {
                this.tip.remove();
            }
            this._disposePopper();
            super.dispose();
        }
        show() {
            if (this._element.style.display === "none") {
                throw new Error("Please use show on visible elements");
            }
            if (!(this.isWithContent() && this._isEnabled)) {
                return;
            }
            const showEvent = EventHandler.trigger(this._element, this.constructor.Event.SHOW);
            const shadowRoot = findShadowRoot(this._element);
            const isInTheDom = shadowRoot === null ? this._element.ownerDocument.documentElement.contains(this._element) : shadowRoot.contains(this._element);
            if (showEvent.defaultPrevented || !isInTheDom) {
                return;
            }
            if (this.constructor.NAME === "tooltip" && this.tip && this.getTitle() !== this.tip.querySelector(SELECTOR_TOOLTIP_INNER).innerHTML) {
                this._disposePopper();
                this.tip.remove();
                this.tip = null;
            }
            const tip = this.getTipElement();
            const tipId = getUID(this.constructor.NAME);
            tip.setAttribute("id", tipId);
            this._element.setAttribute("aria-describedby", tipId);
            if (this._config.animation) {
                tip.classList.add(CLASS_NAME_FADE$2);
            }
            const placement = typeof this._config.placement === "function" ? this._config.placement.call(this, tip, this._element) : this._config.placement;
            const attachment = this._getAttachment(placement);
            this._addAttachmentClass(attachment);
            const {
                container
            } = this._config;
            Data.set(tip, this.constructor.DATA_KEY, this);
            if (!this._element.ownerDocument.documentElement.contains(this.tip)) {
                container.append(tip);
                EventHandler.trigger(this._element, this.constructor.Event.INSERTED);
            }
            if (this._popper) {
                this._popper.update();
            } else {
                this._popper = createPopper(this._element, tip, this._getPopperConfig(attachment));
            }
            tip.classList.add(CLASS_NAME_SHOW$2);
            const customClass = this._resolvePossibleFunction(this._config.customClass);
            if (customClass) {
                tip.classList.add(...customClass.split(" "));
            }
            if ("ontouchstart" in document.documentElement) {
                [].concat(...document.body.children).forEach(element => {
                    EventHandler.on(element, "mouseover", noop);
                });
            }
            const complete = () => {
                const prevHoverState = this._hoverState;
                this._hoverState = null;
                EventHandler.trigger(this._element, this.constructor.Event.SHOWN);
                if (prevHoverState === HOVER_STATE_OUT) {
                    this._leave(null, this);
                }
            };
            const isAnimated = this.tip.classList.contains(CLASS_NAME_FADE$2);
            this._queueCallback(complete, this.tip, isAnimated);
        }
        hide() {
            if (!this._popper) {
                return;
            }
            const tip = this.getTipElement();
            const complete = () => {
                if (this._isWithActiveTrigger()) {
                    return;
                }
                if (this._hoverState !== HOVER_STATE_SHOW) {
                    tip.remove();
                }
                this._cleanTipClass();
                this._element.removeAttribute("aria-describedby");
                EventHandler.trigger(this._element, this.constructor.Event.HIDDEN);
                this._disposePopper();
            };
            const hideEvent = EventHandler.trigger(this._element, this.constructor.Event.HIDE);
            if (hideEvent.defaultPrevented) {
                return;
            }
            tip.classList.remove(CLASS_NAME_SHOW$2);
            if ("ontouchstart" in document.documentElement) {
                [].concat(...document.body.children).forEach(element => EventHandler.off(element, "mouseover", noop));
            }
            this._activeTrigger[TRIGGER_CLICK] = false;
            this._activeTrigger[TRIGGER_FOCUS] = false;
            this._activeTrigger[TRIGGER_HOVER] = false;
            const isAnimated = this.tip.classList.contains(CLASS_NAME_FADE$2);
            this._queueCallback(complete, this.tip, isAnimated);
            this._hoverState = "";
        }
        update() {
            if (this._popper !== null) {
                this._popper.update();
            }
        }
        isWithContent() {
            return Boolean(this.getTitle());
        }
        getTipElement() {
            if (this.tip) {
                return this.tip;
            }
            const element = document.createElement("div");
            element.innerHTML = this._config.template;
            const tip = element.children[0];
            this.setContent(tip);
            tip.classList.remove(CLASS_NAME_FADE$2, CLASS_NAME_SHOW$2);
            this.tip = tip;
            return this.tip;
        }
        setContent(tip) {
            this._sanitizeAndSetContent(tip, this.getTitle(), SELECTOR_TOOLTIP_INNER);
        }
        _sanitizeAndSetContent(template, content, selector) {
            const templateElement = SelectorEngine.findOne(selector, template);
            if (!content && templateElement) {
                templateElement.remove();
                return;
            }
            this.setElementContent(templateElement, content);
        }
        setElementContent(element, content) {
            if (element === null) {
                return;
            }
            if (isElement$1(content)) {
                content = getElement(content);
                if (this._config.html) {
                    if (content.parentNode !== element) {
                        element.innerHTML = "";
                        element.append(content);
                    }
                } else {
                    element.textContent = content.textContent;
                }
                return;
            }
            if (this._config.html) {
                if (this._config.sanitize) {
                    content = sanitizeHtml(content, this._config.allowList, this._config.sanitizeFn);
                }
                element.innerHTML = content;
            } else {
                element.textContent = content;
            }
        }
        getTitle() {
            const title = this._element.getAttribute("data-bs-original-title") || this._config.title;
            return this._resolvePossibleFunction(title);
        }
        updateAttachment(attachment) {
            if (attachment === "right") {
                return "end";
            }
            if (attachment === "left") {
                return "start";
            }
            return attachment;
        }
        _initializeOnDelegatedTarget(event, context) {
            return context || this.constructor.getOrCreateInstance(event.delegateTarget, this._getDelegateConfig());
        }
        _getOffset() {
            const {
                offset
            } = this._config;
            if (typeof offset === "string") {
                return offset.split(",").map(val => Number.parseInt(val, 10));
            }
            if (typeof offset === "function") {
                return popperData => offset(popperData, this._element);
            }
            return offset;
        }
        _resolvePossibleFunction(content) {
            return typeof content === "function" ? content.call(this._element) : content;
        }
        _getPopperConfig(attachment) {
            const defaultBsPopperConfig = {
                placement: attachment,
                modifiers: [ {
                    name: "flip",
                    options: {
                        fallbackPlacements: this._config.fallbackPlacements
                    }
                }, {
                    name: "offset",
                    options: {
                        offset: this._getOffset()
                    }
                }, {
                    name: "preventOverflow",
                    options: {
                        boundary: this._config.boundary
                    }
                }, {
                    name: "arrow",
                    options: {
                        element: `.${this.constructor.NAME}-arrow`
                    }
                }, {
                    name: "onChange",
                    enabled: true,
                    phase: "afterWrite",
                    fn: data => this._handlePopperPlacementChange(data)
                } ],
                onFirstUpdate: data => {
                    if (data.options.placement !== data.placement) {
                        this._handlePopperPlacementChange(data);
                    }
                }
            };
            return {
                ...defaultBsPopperConfig,
                ...typeof this._config.popperConfig === "function" ? this._config.popperConfig(defaultBsPopperConfig) : this._config.popperConfig
            };
        }
        _addAttachmentClass(attachment) {
            this.getTipElement().classList.add(`${this._getBasicClassPrefix()}-${this.updateAttachment(attachment)}`);
        }
        _getAttachment(placement) {
            return AttachmentMap[placement.toUpperCase()];
        }
        _setListeners() {
            const triggers = this._config.trigger.split(" ");
            triggers.forEach(trigger => {
                if (trigger === "click") {
                    EventHandler.on(this._element, this.constructor.Event.CLICK, this._config.selector, event => this.toggle(event));
                } else if (trigger !== TRIGGER_MANUAL) {
                    const eventIn = trigger === TRIGGER_HOVER ? this.constructor.Event.MOUSEENTER : this.constructor.Event.FOCUSIN;
                    const eventOut = trigger === TRIGGER_HOVER ? this.constructor.Event.MOUSELEAVE : this.constructor.Event.FOCUSOUT;
                    EventHandler.on(this._element, eventIn, this._config.selector, event => this._enter(event));
                    EventHandler.on(this._element, eventOut, this._config.selector, event => this._leave(event));
                }
            });
            this._hideModalHandler = () => {
                if (this._element) {
                    this.hide();
                }
            };
            EventHandler.on(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
            if (this._config.selector) {
                this._config = {
                    ...this._config,
                    trigger: "manual",
                    selector: ""
                };
            } else {
                this._fixTitle();
            }
        }
        _fixTitle() {
            const title = this._element.getAttribute("title");
            const originalTitleType = typeof this._element.getAttribute("data-bs-original-title");
            if (title || originalTitleType !== "string") {
                this._element.setAttribute("data-bs-original-title", title || "");
                if (title && !this._element.getAttribute("aria-label") && !this._element.textContent) {
                    this._element.setAttribute("aria-label", title);
                }
                this._element.setAttribute("title", "");
            }
        }
        _enter(event, context) {
            context = this._initializeOnDelegatedTarget(event, context);
            if (event) {
                context._activeTrigger[event.type === "focusin" ? TRIGGER_FOCUS : TRIGGER_HOVER] = true;
            }
            if (context.getTipElement().classList.contains(CLASS_NAME_SHOW$2) || context._hoverState === HOVER_STATE_SHOW) {
                context._hoverState = HOVER_STATE_SHOW;
                return;
            }
            clearTimeout(context._timeout);
            context._hoverState = HOVER_STATE_SHOW;
            if (!context._config.delay || !context._config.delay.show) {
                context.show();
                return;
            }
            context._timeout = setTimeout(() => {
                if (context._hoverState === HOVER_STATE_SHOW) {
                    context.show();
                }
            }, context._config.delay.show);
        }
        _leave(event, context) {
            context = this._initializeOnDelegatedTarget(event, context);
            if (event) {
                context._activeTrigger[event.type === "focusout" ? TRIGGER_FOCUS : TRIGGER_HOVER] = context._element.contains(event.relatedTarget);
            }
            if (context._isWithActiveTrigger()) {
                return;
            }
            clearTimeout(context._timeout);
            context._hoverState = HOVER_STATE_OUT;
            if (!context._config.delay || !context._config.delay.hide) {
                context.hide();
                return;
            }
            context._timeout = setTimeout(() => {
                if (context._hoverState === HOVER_STATE_OUT) {
                    context.hide();
                }
            }, context._config.delay.hide);
        }
        _isWithActiveTrigger() {
            for (const trigger in this._activeTrigger) {
                if (this._activeTrigger[trigger]) {
                    return true;
                }
            }
            return false;
        }
        _getConfig(config) {
            const dataAttributes = Manipulator.getDataAttributes(this._element);
            Object.keys(dataAttributes).forEach(dataAttr => {
                if (DISALLOWED_ATTRIBUTES.has(dataAttr)) {
                    delete dataAttributes[dataAttr];
                }
            });
            config = {
                ...this.constructor.Default,
                ...dataAttributes,
                ...typeof config === "object" && config ? config : {}
            };
            config.container = config.container === false ? document.body : getElement(config.container);
            if (typeof config.delay === "number") {
                config.delay = {
                    show: config.delay,
                    hide: config.delay
                };
            }
            if (typeof config.title === "number") {
                config.title = config.title.toString();
            }
            if (typeof config.content === "number") {
                config.content = config.content.toString();
            }
            typeCheckConfig(NAME$4, config, this.constructor.DefaultType);
            if (config.sanitize) {
                config.template = sanitizeHtml(config.template, config.allowList, config.sanitizeFn);
            }
            return config;
        }
        _getDelegateConfig() {
            const config = {};
            for (const key in this._config) {
                if (this.constructor.Default[key] !== this._config[key]) {
                    config[key] = this._config[key];
                }
            }
            return config;
        }
        _cleanTipClass() {
            const tip = this.getTipElement();
            const basicClassPrefixRegex = new RegExp(`(^|\\s)${this._getBasicClassPrefix()}\\S+`, "g");
            const tabClass = tip.getAttribute("class").match(basicClassPrefixRegex);
            if (tabClass !== null && tabClass.length > 0) {
                tabClass.map(token => token.trim()).forEach(tClass => tip.classList.remove(tClass));
            }
        }
        _getBasicClassPrefix() {
            return CLASS_PREFIX$1;
        }
        _handlePopperPlacementChange(popperData) {
            const {
                state
            } = popperData;
            if (!state) {
                return;
            }
            this.tip = state.elements.popper;
            this._cleanTipClass();
            this._addAttachmentClass(this._getAttachment(state.placement));
        }
        _disposePopper() {
            if (this._popper) {
                this._popper.destroy();
                this._popper = null;
            }
        }
        static jQueryInterface(config) {
            return this.each(function() {
                const data = Tooltip.getOrCreateInstance(this, config);
                if (typeof config === "string") {
                    if (typeof data[config] === "undefined") {
                        throw new TypeError(`No method named "${config}"`);
                    }
                    data[config]();
                }
            });
        }
    }
    defineJQueryPlugin(Tooltip);
    const NAME$3 = "popover";
    const DATA_KEY$3 = "bs.popover";
    const EVENT_KEY$3 = `.${DATA_KEY$3}`;
    const CLASS_PREFIX = "bs-popover";
    const Default$2 = {
        ...Tooltip.Default,
        placement: "right",
        offset: [ 0, 8 ],
        trigger: "click",
        content: "",
        template: '<div class="popover" role="tooltip">' + '<div class="popover-arrow"></div>' + '<h3 class="popover-header"></h3>' + '<div class="popover-body"></div>' + "</div>"
    };
    const DefaultType$2 = {
        ...Tooltip.DefaultType,
        content: "(string|element|function)"
    };
    const Event$1 = {
        HIDE: `hide${EVENT_KEY$3}`,
        HIDDEN: `hidden${EVENT_KEY$3}`,
        SHOW: `show${EVENT_KEY$3}`,
        SHOWN: `shown${EVENT_KEY$3}`,
        INSERTED: `inserted${EVENT_KEY$3}`,
        CLICK: `click${EVENT_KEY$3}`,
        FOCUSIN: `focusin${EVENT_KEY$3}`,
        FOCUSOUT: `focusout${EVENT_KEY$3}`,
        MOUSEENTER: `mouseenter${EVENT_KEY$3}`,
        MOUSELEAVE: `mouseleave${EVENT_KEY$3}`
    };
    const SELECTOR_TITLE = ".popover-header";
    const SELECTOR_CONTENT = ".popover-body";
    class Popover extends Tooltip {
        static get Default() {
            return Default$2;
        }
        static get NAME() {
            return NAME$3;
        }
        static get Event() {
            return Event$1;
        }
        static get DefaultType() {
            return DefaultType$2;
        }
        isWithContent() {
            return this.getTitle() || this._getContent();
        }
        setContent(tip) {
            this._sanitizeAndSetContent(tip, this.getTitle(), SELECTOR_TITLE);
            this._sanitizeAndSetContent(tip, this._getContent(), SELECTOR_CONTENT);
        }
        _getContent() {
            return this._resolvePossibleFunction(this._config.content);
        }
        _getBasicClassPrefix() {
            return CLASS_PREFIX;
        }
        static jQueryInterface(config) {
            return this.each(function() {
                const data = Popover.getOrCreateInstance(this, config);
                if (typeof config === "string") {
                    if (typeof data[config] === "undefined") {
                        throw new TypeError(`No method named "${config}"`);
                    }
                    data[config]();
                }
            });
        }
    }
    defineJQueryPlugin(Popover);
    const NAME$2 = "scrollspy";
    const DATA_KEY$2 = "bs.scrollspy";
    const EVENT_KEY$2 = `.${DATA_KEY$2}`;
    const DATA_API_KEY$1 = ".data-api";
    const Default$1 = {
        offset: 10,
        method: "auto",
        target: ""
    };
    const DefaultType$1 = {
        offset: "number",
        method: "string",
        target: "(string|element)"
    };
    const EVENT_ACTIVATE = `activate${EVENT_KEY$2}`;
    const EVENT_SCROLL = `scroll${EVENT_KEY$2}`;
    const EVENT_LOAD_DATA_API = `load${EVENT_KEY$2}${DATA_API_KEY$1}`;
    const CLASS_NAME_DROPDOWN_ITEM = "dropdown-item";
    const CLASS_NAME_ACTIVE$1 = "active";
    const SELECTOR_DATA_SPY = '[data-bs-spy="scroll"]';
    const SELECTOR_NAV_LIST_GROUP$1 = ".nav, .list-group";
    const SELECTOR_NAV_LINKS = ".nav-link";
    const SELECTOR_NAV_ITEMS = ".nav-item";
    const SELECTOR_LIST_ITEMS = ".list-group-item";
    const SELECTOR_LINK_ITEMS = `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}, .${CLASS_NAME_DROPDOWN_ITEM}`;
    const SELECTOR_DROPDOWN$1 = ".dropdown";
    const SELECTOR_DROPDOWN_TOGGLE$1 = ".dropdown-toggle";
    const METHOD_OFFSET = "offset";
    const METHOD_POSITION = "position";
    class ScrollSpy extends BaseComponent {
        constructor(element, config) {
            super(element);
            this._scrollElement = this._element.tagName === "BODY" ? window : this._element;
            this._config = this._getConfig(config);
            this._offsets = [];
            this._targets = [];
            this._activeTarget = null;
            this._scrollHeight = 0;
            EventHandler.on(this._scrollElement, EVENT_SCROLL, () => this._process());
            this.refresh();
            this._process();
        }
        static get Default() {
            return Default$1;
        }
        static get NAME() {
            return NAME$2;
        }
        refresh() {
            const autoMethod = this._scrollElement === this._scrollElement.window ? METHOD_OFFSET : METHOD_POSITION;
            const offsetMethod = this._config.method === "auto" ? autoMethod : this._config.method;
            const offsetBase = offsetMethod === METHOD_POSITION ? this._getScrollTop() : 0;
            this._offsets = [];
            this._targets = [];
            this._scrollHeight = this._getScrollHeight();
            const targets = SelectorEngine.find(SELECTOR_LINK_ITEMS, this._config.target);
            targets.map(element => {
                const targetSelector = getSelectorFromElement(element);
                const target = targetSelector ? SelectorEngine.findOne(targetSelector) : null;
                if (target) {
                    const targetBCR = target.getBoundingClientRect();
                    if (targetBCR.width || targetBCR.height) {
                        return [ Manipulator[offsetMethod](target).top + offsetBase, targetSelector ];
                    }
                }
                return null;
            }).filter(item => item).sort((a, b) => a[0] - b[0]).forEach(item => {
                this._offsets.push(item[0]);
                this._targets.push(item[1]);
            });
        }
        dispose() {
            EventHandler.off(this._scrollElement, EVENT_KEY$2);
            super.dispose();
        }
        _getConfig(config) {
            config = {
                ...Default$1,
                ...Manipulator.getDataAttributes(this._element),
                ...typeof config === "object" && config ? config : {}
            };
            config.target = getElement(config.target) || document.documentElement;
            typeCheckConfig(NAME$2, config, DefaultType$1);
            return config;
        }
        _getScrollTop() {
            return this._scrollElement === window ? this._scrollElement.pageYOffset : this._scrollElement.scrollTop;
        }
        _getScrollHeight() {
            return this._scrollElement.scrollHeight || Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        }
        _getOffsetHeight() {
            return this._scrollElement === window ? window.innerHeight : this._scrollElement.getBoundingClientRect().height;
        }
        _process() {
            const scrollTop = this._getScrollTop() + this._config.offset;
            const scrollHeight = this._getScrollHeight();
            const maxScroll = this._config.offset + scrollHeight - this._getOffsetHeight();
            if (this._scrollHeight !== scrollHeight) {
                this.refresh();
            }
            if (scrollTop >= maxScroll) {
                const target = this._targets[this._targets.length - 1];
                if (this._activeTarget !== target) {
                    this._activate(target);
                }
                return;
            }
            if (this._activeTarget && scrollTop < this._offsets[0] && this._offsets[0] > 0) {
                this._activeTarget = null;
                this._clear();
                return;
            }
            for (let i = this._offsets.length; i--; ) {
                const isActiveTarget = this._activeTarget !== this._targets[i] && scrollTop >= this._offsets[i] && (typeof this._offsets[i + 1] === "undefined" || scrollTop < this._offsets[i + 1]);
                if (isActiveTarget) {
                    this._activate(this._targets[i]);
                }
            }
        }
        _activate(target) {
            this._activeTarget = target;
            this._clear();
            const queries = SELECTOR_LINK_ITEMS.split(",").map(selector => `${selector}[data-bs-target="${target}"],${selector}[href="${target}"]`);
            const link = SelectorEngine.findOne(queries.join(","), this._config.target);
            link.classList.add(CLASS_NAME_ACTIVE$1);
            if (link.classList.contains(CLASS_NAME_DROPDOWN_ITEM)) {
                SelectorEngine.findOne(SELECTOR_DROPDOWN_TOGGLE$1, link.closest(SELECTOR_DROPDOWN$1)).classList.add(CLASS_NAME_ACTIVE$1);
            } else {
                SelectorEngine.parents(link, SELECTOR_NAV_LIST_GROUP$1).forEach(listGroup => {
                    SelectorEngine.prev(listGroup, `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`).forEach(item => item.classList.add(CLASS_NAME_ACTIVE$1));
                    SelectorEngine.prev(listGroup, SELECTOR_NAV_ITEMS).forEach(navItem => {
                        SelectorEngine.children(navItem, SELECTOR_NAV_LINKS).forEach(item => item.classList.add(CLASS_NAME_ACTIVE$1));
                    });
                });
            }
            EventHandler.trigger(this._scrollElement, EVENT_ACTIVATE, {
                relatedTarget: target
            });
        }
        _clear() {
            SelectorEngine.find(SELECTOR_LINK_ITEMS, this._config.target).filter(node => node.classList.contains(CLASS_NAME_ACTIVE$1)).forEach(node => node.classList.remove(CLASS_NAME_ACTIVE$1));
        }
        static jQueryInterface(config) {
            return this.each(function() {
                const data = ScrollSpy.getOrCreateInstance(this, config);
                if (typeof config !== "string") {
                    return;
                }
                if (typeof data[config] === "undefined") {
                    throw new TypeError(`No method named "${config}"`);
                }
                data[config]();
            });
        }
    }
    EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
        SelectorEngine.find(SELECTOR_DATA_SPY).forEach(spy => new ScrollSpy(spy));
    });
    defineJQueryPlugin(ScrollSpy);
    const NAME$1 = "tab";
    const DATA_KEY$1 = "bs.tab";
    const EVENT_KEY$1 = `.${DATA_KEY$1}`;
    const DATA_API_KEY = ".data-api";
    const EVENT_HIDE$1 = `hide${EVENT_KEY$1}`;
    const EVENT_HIDDEN$1 = `hidden${EVENT_KEY$1}`;
    const EVENT_SHOW$1 = `show${EVENT_KEY$1}`;
    const EVENT_SHOWN$1 = `shown${EVENT_KEY$1}`;
    const EVENT_CLICK_DATA_API = `click${EVENT_KEY$1}${DATA_API_KEY}`;
    const CLASS_NAME_DROPDOWN_MENU = "dropdown-menu";
    const CLASS_NAME_ACTIVE = "active";
    const CLASS_NAME_FADE$1 = "fade";
    const CLASS_NAME_SHOW$1 = "show";
    const SELECTOR_DROPDOWN = ".dropdown";
    const SELECTOR_NAV_LIST_GROUP = ".nav, .list-group";
    const SELECTOR_ACTIVE = ".active";
    const SELECTOR_ACTIVE_UL = ":scope > li > .active";
    const SELECTOR_DATA_TOGGLE = '[data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-bs-toggle="list"]';
    const SELECTOR_DROPDOWN_TOGGLE = ".dropdown-toggle";
    const SELECTOR_DROPDOWN_ACTIVE_CHILD = ":scope > .dropdown-menu .active";
    class Tab extends BaseComponent {
        static get NAME() {
            return NAME$1;
        }
        show() {
            if (this._element.parentNode && this._element.parentNode.nodeType === Node.ELEMENT_NODE && this._element.classList.contains(CLASS_NAME_ACTIVE)) {
                return;
            }
            let previous;
            const target = getElementFromSelector(this._element);
            const listElement = this._element.closest(SELECTOR_NAV_LIST_GROUP);
            if (listElement) {
                const itemSelector = listElement.nodeName === "UL" || listElement.nodeName === "OL" ? SELECTOR_ACTIVE_UL : SELECTOR_ACTIVE;
                previous = SelectorEngine.find(itemSelector, listElement);
                previous = previous[previous.length - 1];
            }
            const hideEvent = previous ? EventHandler.trigger(previous, EVENT_HIDE$1, {
                relatedTarget: this._element
            }) : null;
            const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$1, {
                relatedTarget: previous
            });
            if (showEvent.defaultPrevented || hideEvent !== null && hideEvent.defaultPrevented) {
                return;
            }
            this._activate(this._element, listElement);
            const complete = () => {
                EventHandler.trigger(previous, EVENT_HIDDEN$1, {
                    relatedTarget: this._element
                });
                EventHandler.trigger(this._element, EVENT_SHOWN$1, {
                    relatedTarget: previous
                });
            };
            if (target) {
                this._activate(target, target.parentNode, complete);
            } else {
                complete();
            }
        }
        _activate(element, container, callback) {
            const activeElements = container && (container.nodeName === "UL" || container.nodeName === "OL") ? SelectorEngine.find(SELECTOR_ACTIVE_UL, container) : SelectorEngine.children(container, SELECTOR_ACTIVE);
            const active = activeElements[0];
            const isTransitioning = callback && active && active.classList.contains(CLASS_NAME_FADE$1);
            const complete = () => this._transitionComplete(element, active, callback);
            if (active && isTransitioning) {
                active.classList.remove(CLASS_NAME_SHOW$1);
                this._queueCallback(complete, element, true);
            } else {
                complete();
            }
        }
        _transitionComplete(element, active, callback) {
            if (active) {
                active.classList.remove(CLASS_NAME_ACTIVE);
                const dropdownChild = SelectorEngine.findOne(SELECTOR_DROPDOWN_ACTIVE_CHILD, active.parentNode);
                if (dropdownChild) {
                    dropdownChild.classList.remove(CLASS_NAME_ACTIVE);
                }
                if (active.getAttribute("role") === "tab") {
                    active.setAttribute("aria-selected", false);
                }
            }
            element.classList.add(CLASS_NAME_ACTIVE);
            if (element.getAttribute("role") === "tab") {
                element.setAttribute("aria-selected", true);
            }
            reflow(element);
            if (element.classList.contains(CLASS_NAME_FADE$1)) {
                element.classList.add(CLASS_NAME_SHOW$1);
            }
            let parent = element.parentNode;
            if (parent && parent.nodeName === "LI") {
                parent = parent.parentNode;
            }
            if (parent && parent.classList.contains(CLASS_NAME_DROPDOWN_MENU)) {
                const dropdownElement = element.closest(SELECTOR_DROPDOWN);
                if (dropdownElement) {
                    SelectorEngine.find(SELECTOR_DROPDOWN_TOGGLE, dropdownElement).forEach(dropdown => dropdown.classList.add(CLASS_NAME_ACTIVE));
                }
                element.setAttribute("aria-expanded", true);
            }
            if (callback) {
                callback();
            }
        }
        static jQueryInterface(config) {
            return this.each(function() {
                const data = Tab.getOrCreateInstance(this);
                if (typeof config === "string") {
                    if (typeof data[config] === "undefined") {
                        throw new TypeError(`No method named "${config}"`);
                    }
                    data[config]();
                }
            });
        }
    }
    EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function(event) {
        if ([ "A", "AREA" ].includes(this.tagName)) {
            event.preventDefault();
        }
        if (isDisabled(this)) {
            return;
        }
        const data = Tab.getOrCreateInstance(this);
        data.show();
    });
    defineJQueryPlugin(Tab);
    const NAME = "toast";
    const DATA_KEY = "bs.toast";
    const EVENT_KEY = `.${DATA_KEY}`;
    const EVENT_MOUSEOVER = `mouseover${EVENT_KEY}`;
    const EVENT_MOUSEOUT = `mouseout${EVENT_KEY}`;
    const EVENT_FOCUSIN = `focusin${EVENT_KEY}`;
    const EVENT_FOCUSOUT = `focusout${EVENT_KEY}`;
    const EVENT_HIDE = `hide${EVENT_KEY}`;
    const EVENT_HIDDEN = `hidden${EVENT_KEY}`;
    const EVENT_SHOW = `show${EVENT_KEY}`;
    const EVENT_SHOWN = `shown${EVENT_KEY}`;
    const CLASS_NAME_FADE = "fade";
    const CLASS_NAME_HIDE = "hide";
    const CLASS_NAME_SHOW = "show";
    const CLASS_NAME_SHOWING = "showing";
    const DefaultType = {
        animation: "boolean",
        autohide: "boolean",
        delay: "number"
    };
    const Default = {
        animation: true,
        autohide: true,
        delay: 5e3
    };
    class Toast extends BaseComponent {
        constructor(element, config) {
            super(element);
            this._config = this._getConfig(config);
            this._timeout = null;
            this._hasMouseInteraction = false;
            this._hasKeyboardInteraction = false;
            this._setListeners();
        }
        static get DefaultType() {
            return DefaultType;
        }
        static get Default() {
            return Default;
        }
        static get NAME() {
            return NAME;
        }
        show() {
            const showEvent = EventHandler.trigger(this._element, EVENT_SHOW);
            if (showEvent.defaultPrevented) {
                return;
            }
            this._clearTimeout();
            if (this._config.animation) {
                this._element.classList.add(CLASS_NAME_FADE);
            }
            const complete = () => {
                this._element.classList.remove(CLASS_NAME_SHOWING);
                EventHandler.trigger(this._element, EVENT_SHOWN);
                this._maybeScheduleHide();
            };
            this._element.classList.remove(CLASS_NAME_HIDE);
            reflow(this._element);
            this._element.classList.add(CLASS_NAME_SHOW);
            this._element.classList.add(CLASS_NAME_SHOWING);
            this._queueCallback(complete, this._element, this._config.animation);
        }
        hide() {
            if (!this._element.classList.contains(CLASS_NAME_SHOW)) {
                return;
            }
            const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE);
            if (hideEvent.defaultPrevented) {
                return;
            }
            const complete = () => {
                this._element.classList.add(CLASS_NAME_HIDE);
                this._element.classList.remove(CLASS_NAME_SHOWING);
                this._element.classList.remove(CLASS_NAME_SHOW);
                EventHandler.trigger(this._element, EVENT_HIDDEN);
            };
            this._element.classList.add(CLASS_NAME_SHOWING);
            this._queueCallback(complete, this._element, this._config.animation);
        }
        dispose() {
            this._clearTimeout();
            if (this._element.classList.contains(CLASS_NAME_SHOW)) {
                this._element.classList.remove(CLASS_NAME_SHOW);
            }
            super.dispose();
        }
        _getConfig(config) {
            config = {
                ...Default,
                ...Manipulator.getDataAttributes(this._element),
                ...typeof config === "object" && config ? config : {}
            };
            typeCheckConfig(NAME, config, this.constructor.DefaultType);
            return config;
        }
        _maybeScheduleHide() {
            if (!this._config.autohide) {
                return;
            }
            if (this._hasMouseInteraction || this._hasKeyboardInteraction) {
                return;
            }
            this._timeout = setTimeout(() => {
                this.hide();
            }, this._config.delay);
        }
        _onInteraction(event, isInteracting) {
            switch (event.type) {
              case "mouseover":
              case "mouseout":
                this._hasMouseInteraction = isInteracting;
                break;

              case "focusin":
              case "focusout":
                this._hasKeyboardInteraction = isInteracting;
                break;
            }
            if (isInteracting) {
                this._clearTimeout();
                return;
            }
            const nextElement = event.relatedTarget;
            if (this._element === nextElement || this._element.contains(nextElement)) {
                return;
            }
            this._maybeScheduleHide();
        }
        _setListeners() {
            EventHandler.on(this._element, EVENT_MOUSEOVER, event => this._onInteraction(event, true));
            EventHandler.on(this._element, EVENT_MOUSEOUT, event => this._onInteraction(event, false));
            EventHandler.on(this._element, EVENT_FOCUSIN, event => this._onInteraction(event, true));
            EventHandler.on(this._element, EVENT_FOCUSOUT, event => this._onInteraction(event, false));
        }
        _clearTimeout() {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
        static jQueryInterface(config) {
            return this.each(function() {
                const data = Toast.getOrCreateInstance(this, config);
                if (typeof config === "string") {
                    if (typeof data[config] === "undefined") {
                        throw new TypeError(`No method named "${config}"`);
                    }
                    data[config](this);
                }
            });
        }
    }
    enableDismissTrigger(Toast);
    defineJQueryPlugin(Toast);
    const index_umd = {
        Alert: Alert,
        Button: Button,
        Carousel: Carousel,
        Collapse: Collapse,
        Dropdown: Dropdown,
        Modal: Modal,
        Offcanvas: Offcanvas,
        Popover: Popover,
        ScrollSpy: ScrollSpy,
        Tab: Tab,
        Toast: Toast,
        Tooltip: Tooltip
    };
    return index_umd;
});

(function(root, factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define([ "jquery" ], factory);
    } else if (typeof exports === "object") {
        module.exports = factory(require("jquery"));
    } else {
        root.bootbox = factory(root.jQuery);
    }
})(this, function init($, undefined) {
    "use strict";
    if (!Object.keys) {
        Object.keys = function() {
            var hasOwnProperty = Object.prototype.hasOwnProperty, hasDontEnumBug = !{
                toString: null
            }.propertyIsEnumerable("toString"), dontEnums = [ "toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor" ], dontEnumsLength = dontEnums.length;
            return function(obj) {
                if (typeof obj !== "function" && (typeof obj !== "object" || obj === null)) {
                    throw new TypeError("Object.keys called on non-object");
                }
                var result = [], prop, i;
                for (prop in obj) {
                    if (hasOwnProperty.call(obj, prop)) {
                        result.push(prop);
                    }
                }
                if (hasDontEnumBug) {
                    for (i = 0; i < dontEnumsLength; i++) {
                        if (hasOwnProperty.call(obj, dontEnums[i])) {
                            result.push(dontEnums[i]);
                        }
                    }
                }
                return result;
            };
        }();
    }
    var exports = {};
    var VERSION = "5.5.3";
    exports.VERSION = VERSION;
    var locales = {
        en: {
            OK: "OK",
            CANCEL: "Cancel",
            CONFIRM: "OK"
        }
    };
    var templates = {
        dialog: '<div class="bootbox modal" tabindex="-1" role="dialog" aria-hidden="true">' + '<div class="modal-dialog">' + '<div class="modal-content">' + '<div class="modal-body"><div class="bootbox-body"></div></div>' + "</div>" + "</div>" + "</div>",
        header: '<div class="modal-header">' + '<h5 class="modal-title"></h5>' + "</div>",
        footer: '<div class="modal-footer"></div>',
        closeButton: '<button type="button" class="bootbox-close-button btn-close" aria-hidden="true"></button>',
        form: '<form class="bootbox-form"></form>',
        button: '<button type="button" class="btn"></button>',
        option: "<option></option>",
        promptMessage: '<div class="bootbox-prompt-message"></div>',
        inputs: {
            text: '<input class="bootbox-input bootbox-input-text form-control" autocomplete="off" type="text" />',
            textarea: '<textarea class="bootbox-input bootbox-input-textarea form-control"></textarea>',
            email: '<input class="bootbox-input bootbox-input-email form-control" autocomplete="off" type="email" />',
            select: '<select class="bootbox-input bootbox-input-select form-control"></select>',
            checkbox: '<div class="form-check checkbox"><label class="form-check-label"><input class="form-check-input bootbox-input bootbox-input-checkbox" type="checkbox" /></label></div>',
            radio: '<div class="form-check radio"><label class="form-check-label"><input class="form-check-input bootbox-input bootbox-input-radio" type="radio" name="bootbox-radio" /></label></div>',
            date: '<input class="bootbox-input bootbox-input-date form-control" autocomplete="off" type="date" />',
            time: '<input class="bootbox-input bootbox-input-time form-control" autocomplete="off" type="time" />',
            number: '<input class="bootbox-input bootbox-input-number form-control" autocomplete="off" type="number" />',
            password: '<input class="bootbox-input bootbox-input-password form-control" autocomplete="off" type="password" />',
            range: '<input class="bootbox-input bootbox-input-range form-control-range" autocomplete="off" type="range" />'
        }
    };
    var defaults = {
        locale: "en",
        backdrop: "static",
        animate: true,
        className: null,
        closeButton: true,
        show: true,
        container: "body",
        value: "",
        inputType: "text",
        swapButtonOrder: false,
        centerVertical: false,
        multiple: false,
        scrollable: false,
        reusable: false,
        relatedTarget: null
    };
    exports.locales = function(name) {
        return name ? locales[name] : locales;
    };
    exports.addLocale = function(name, values) {
        $.each([ "OK", "CANCEL", "CONFIRM" ], function(_, v) {
            if (!values[v]) {
                throw new Error('Please supply a translation for "' + v + '"');
            }
        });
        locales[name] = {
            OK: values.OK,
            CANCEL: values.CANCEL,
            CONFIRM: values.CONFIRM
        };
        return exports;
    };
    exports.removeLocale = function(name) {
        if (name !== "en") {
            delete locales[name];
        } else {
            throw new Error('"en" is used as the default and fallback locale and cannot be removed.');
        }
        return exports;
    };
    exports.setLocale = function(name) {
        return exports.setDefaults("locale", name);
    };
    exports.setDefaults = function() {
        var values = {};
        if (arguments.length === 2) {
            values[arguments[0]] = arguments[1];
        } else {
            values = arguments[0];
        }
        $.extend(defaults, values);
        return exports;
    };
    exports.hideAll = function() {
        $(".bootbox").modal("hide");
        return exports;
    };
    exports.init = function(_$) {
        return init(_$ || $);
    };
    exports.dialog = function(options) {
        if ($.fn.modal === undefined) {
            throw new Error('"$.fn.modal" is not defined; please double check you have included ' + "the Bootstrap JavaScript library. See https://getbootstrap.com/docs/4.4/getting-started/javascript/ " + "for more details.");
        }
        options = sanitize(options);
        if ($.fn.modal.Constructor.VERSION) {
            options.fullBootstrapVersion = $.fn.modal.Constructor.VERSION;
            var i = options.fullBootstrapVersion.indexOf(".");
            options.bootstrap = options.fullBootstrapVersion.substring(0, i);
        } else {
            options.bootstrap = "2";
            options.fullBootstrapVersion = "2.3.2";
            console.warn("Bootbox will *mostly* work with Bootstrap 2, but we do not officially support it. Please upgrade, if possible.");
        }
        var dialog = $(templates.dialog);
        var innerDialog = dialog.find(".modal-dialog");
        var body = dialog.find(".modal-body");
        var header = $(templates.header);
        var footer = $(templates.footer);
        var buttons = options.buttons;
        var callbacks = {
            onEscape: options.onEscape
        };
        body.find(".bootbox-body").html(options.message);
        if (getKeyLength(options.buttons) > 0) {
            each(buttons, function(key, b) {
                var button = $(templates.button);
                button.data("bb-handler", key);
                button.addClass(b.className);
                switch (key) {
                  case "ok":
                  case "confirm":
                    button.addClass("bootbox-accept");
                    break;

                  case "cancel":
                    button.addClass("bootbox-cancel");
                    break;
                }
                button.html(b.label);
                footer.append(button);
                callbacks[key] = b.callback;
            });
            body.after(footer);
        }
        if (options.animate === true) {
            dialog.addClass("fade");
        }
        if (options.className) {
            dialog.addClass(options.className);
        }
        if (options.size) {
            if (options.fullBootstrapVersion.substring(0, 3) < "3.1") {
                console.warn('"size" requires Bootstrap 3.1.0 or higher. You appear to be using ' + options.fullBootstrapVersion + ". Please upgrade to use this option.");
            }
            switch (options.size) {
              case "small":
              case "sm":
                innerDialog.addClass("modal-sm");
                break;

              case "large":
              case "lg":
                innerDialog.addClass("modal-lg");
                break;

              case "extra-large":
              case "xl":
                innerDialog.addClass("modal-xl");
                if (options.fullBootstrapVersion.substring(0, 3) < "4.2") {
                    console.warn('Using size "xl"/"extra-large" requires Bootstrap 4.2.0 or higher. You appear to be using ' + options.fullBootstrapVersion + ". Please upgrade to use this option.");
                }
                break;
            }
        }
        if (options.scrollable) {
            innerDialog.addClass("modal-dialog-scrollable");
            if (options.fullBootstrapVersion.substring(0, 3) < "4.3") {
                console.warn('Using "scrollable" requires Bootstrap 4.3.0 or higher. You appear to be using ' + options.fullBootstrapVersion + ". Please upgrade to use this option.");
            }
        }
        if (options.title) {
            body.before(header);
            dialog.find(".modal-title").html(options.title);
        }
        if (options.closeButton) {
            var closeButton = $(templates.closeButton);
            if (options.title) {
                if (options.bootstrap > 3) {
                    dialog.find(".modal-header").append(closeButton);
                } else {
                    dialog.find(".modal-header").prepend(closeButton);
                }
            } else {
                closeButton.prependTo(body);
            }
        }
        if (options.centerVertical) {
            innerDialog.addClass("modal-dialog-centered");
            if (options.fullBootstrapVersion < "4.0.0") {
                console.warn('"centerVertical" requires Bootstrap 4.0.0-beta.3 or higher. You appear to be using ' + options.fullBootstrapVersion + ". Please upgrade to use this option.");
            }
        }
        if (!options.reusable) {
            dialog.one("hide.bs.modal", {
                dialog: dialog
            }, unbindModal);
        }
        if (options.onHide) {
            if ($.isFunction(options.onHide)) {
                dialog.on("hide.bs.modal", options.onHide);
            } else {
                throw new Error('Argument supplied to "onHide" must be a function');
            }
        }
        if (!options.reusable) {
            dialog.one("hidden.bs.modal", {
                dialog: dialog
            }, destroyModal);
        }
        if (options.onHidden) {
            if ($.isFunction(options.onHidden)) {
                dialog.on("hidden.bs.modal", options.onHidden);
            } else {
                throw new Error('Argument supplied to "onHidden" must be a function');
            }
        }
        if (options.onShow) {
            if ($.isFunction(options.onShow)) {
                dialog.on("show.bs.modal", options.onShow);
            } else {
                throw new Error('Argument supplied to "onShow" must be a function');
            }
        }
        dialog.one("shown.bs.modal", {
            dialog: dialog
        }, focusPrimaryButton);
        if (options.onShown) {
            if ($.isFunction(options.onShown)) {
                dialog.on("shown.bs.modal", options.onShown);
            } else {
                throw new Error('Argument supplied to "onShown" must be a function');
            }
        }
        if (options.backdrop === true) {
            dialog.on("click.dismiss.bs.modal", function(e) {
                if (dialog.children(".modal-backdrop").length) {
                    e.currentTarget = dialog.children(".modal-backdrop").get(0);
                }
                if (e.target !== e.currentTarget) {
                    return;
                }
                dialog.trigger("escape.close.bb");
            });
        }
        dialog.on("escape.close.bb", function(e) {
            if (callbacks.onEscape) {
                processCallback(e, dialog, callbacks.onEscape);
            }
        });
        dialog.on("click", ".modal-footer button:not(.disabled)", function(e) {
            var callbackKey = $(this).data("bb-handler");
            if (callbackKey !== undefined) {
                processCallback(e, dialog, callbacks[callbackKey]);
            }
        });
        dialog.on("click", ".bootbox-close-button", function(e) {
            processCallback(e, dialog, callbacks.onEscape);
        });
        dialog.on("keyup", function(e) {
            if (e.which === 27) {
                dialog.trigger("escape.close.bb");
            }
        });
        $(options.container).append(dialog);
        dialog.modal({
            backdrop: options.backdrop,
            keyboard: false,
            show: false
        });
        if (options.show) {
            dialog.modal("show", options.relatedTarget);
        }
        return dialog;
    };
    exports.alert = function() {
        var options;
        options = mergeDialogOptions("alert", [ "ok" ], [ "message", "callback" ], arguments);
        if (options.callback && !$.isFunction(options.callback)) {
            throw new Error('alert requires the "callback" property to be a function when provided');
        }
        options.buttons.ok.callback = options.onEscape = function() {
            if ($.isFunction(options.callback)) {
                return options.callback.call(this);
            }
            return true;
        };
        return exports.dialog(options);
    };
    exports.confirm = function() {
        var options;
        options = mergeDialogOptions("confirm", [ "cancel", "confirm" ], [ "message", "callback" ], arguments);
        if (!$.isFunction(options.callback)) {
            throw new Error("confirm requires a callback");
        }
        options.buttons.cancel.callback = options.onEscape = function() {
            return options.callback.call(this, false);
        };
        options.buttons.confirm.callback = function() {
            return options.callback.call(this, true);
        };
        return exports.dialog(options);
    };
    exports.prompt = function() {
        var options;
        var promptDialog;
        var form;
        var input;
        var shouldShow;
        var inputOptions;
        form = $(templates.form);
        options = mergeDialogOptions("prompt", [ "cancel", "confirm" ], [ "title", "callback" ], arguments);
        if (!options.value) {
            options.value = defaults.value;
        }
        if (!options.inputType) {
            options.inputType = defaults.inputType;
        }
        shouldShow = options.show === undefined ? defaults.show : options.show;
        options.show = false;
        options.buttons.cancel.callback = options.onEscape = function() {
            return options.callback.call(this, null);
        };
        options.buttons.confirm.callback = function() {
            var value;
            if (options.inputType === "checkbox") {
                value = input.find("input:checked").map(function() {
                    return $(this).val();
                }).get();
            } else if (options.inputType === "radio") {
                value = input.find("input:checked").val();
            } else {
                if (input[0].checkValidity && !input[0].checkValidity()) {
                    return false;
                } else {
                    if (options.inputType === "select" && options.multiple === true) {
                        value = input.find("option:selected").map(function() {
                            return $(this).val();
                        }).get();
                    } else {
                        value = input.val();
                    }
                }
            }
            return options.callback.call(this, value);
        };
        if (!options.title) {
            throw new Error("prompt requires a title");
        }
        if (!$.isFunction(options.callback)) {
            throw new Error("prompt requires a callback");
        }
        if (!templates.inputs[options.inputType]) {
            throw new Error("Invalid prompt type");
        }
        input = $(templates.inputs[options.inputType]);
        switch (options.inputType) {
          case "text":
          case "textarea":
          case "email":
          case "password":
            input.val(options.value);
            if (options.placeholder) {
                input.attr("placeholder", options.placeholder);
            }
            if (options.pattern) {
                input.attr("pattern", options.pattern);
            }
            if (options.maxlength) {
                input.attr("maxlength", options.maxlength);
            }
            if (options.required) {
                input.prop({
                    required: true
                });
            }
            if (options.rows && !isNaN(parseInt(options.rows))) {
                if (options.inputType === "textarea") {
                    input.attr({
                        rows: options.rows
                    });
                }
            }
            break;

          case "date":
          case "time":
          case "number":
          case "range":
            input.val(options.value);
            if (options.placeholder) {
                input.attr("placeholder", options.placeholder);
            }
            if (options.pattern) {
                input.attr("pattern", options.pattern);
            }
            if (options.required) {
                input.prop({
                    required: true
                });
            }
            if (options.inputType !== "date") {
                if (options.step) {
                    if (options.step === "any" || !isNaN(options.step) && parseFloat(options.step) > 0) {
                        input.attr("step", options.step);
                    } else {
                        throw new Error('"step" must be a valid positive number or the value "any". See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-step for more information.');
                    }
                }
            }
            if (minAndMaxAreValid(options.inputType, options.min, options.max)) {
                if (options.min !== undefined) {
                    input.attr("min", options.min);
                }
                if (options.max !== undefined) {
                    input.attr("max", options.max);
                }
            }
            break;

          case "select":
            var groups = {};
            inputOptions = options.inputOptions || [];
            if (!$.isArray(inputOptions)) {
                throw new Error("Please pass an array of input options");
            }
            if (!inputOptions.length) {
                throw new Error('prompt with "inputType" set to "select" requires at least one option');
            }
            if (options.placeholder) {
                input.attr("placeholder", options.placeholder);
            }
            if (options.required) {
                input.prop({
                    required: true
                });
            }
            if (options.multiple) {
                input.prop({
                    multiple: true
                });
            }
            each(inputOptions, function(_, option) {
                var elem = input;
                if (option.value === undefined || option.text === undefined) {
                    throw new Error('each option needs a "value" property and a "text" property');
                }
                if (option.group) {
                    if (!groups[option.group]) {
                        groups[option.group] = $("<optgroup />").attr("label", option.group);
                    }
                    elem = groups[option.group];
                }
                var o = $(templates.option);
                o.attr("value", option.value).text(option.text);
                elem.append(o);
            });
            each(groups, function(_, group) {
                input.append(group);
            });
            input.val(options.value);
            break;

          case "checkbox":
            var checkboxValues = $.isArray(options.value) ? options.value : [ options.value ];
            inputOptions = options.inputOptions || [];
            if (!inputOptions.length) {
                throw new Error('prompt with "inputType" set to "checkbox" requires at least one option');
            }
            input = $('<div class="bootbox-checkbox-list"></div>');
            each(inputOptions, function(_, option) {
                if (option.value === undefined || option.text === undefined) {
                    throw new Error('each option needs a "value" property and a "text" property');
                }
                var checkbox = $(templates.inputs[options.inputType]);
                checkbox.find("input").attr("value", option.value);
                checkbox.find("label").append("\n" + option.text);
                each(checkboxValues, function(_, value) {
                    if (value === option.value) {
                        checkbox.find("input").prop("checked", true);
                    }
                });
                input.append(checkbox);
            });
            break;

          case "radio":
            if (options.value !== undefined && $.isArray(options.value)) {
                throw new Error('prompt with "inputType" set to "radio" requires a single, non-array value for "value"');
            }
            inputOptions = options.inputOptions || [];
            if (!inputOptions.length) {
                throw new Error('prompt with "inputType" set to "radio" requires at least one option');
            }
            input = $('<div class="bootbox-radiobutton-list"></div>');
            var checkFirstRadio = true;
            each(inputOptions, function(_, option) {
                if (option.value === undefined || option.text === undefined) {
                    throw new Error('each option needs a "value" property and a "text" property');
                }
                var radio = $(templates.inputs[options.inputType]);
                radio.find("input").attr("value", option.value);
                radio.find("label").append("\n" + option.text);
                if (options.value !== undefined) {
                    if (option.value === options.value) {
                        radio.find("input").prop("checked", true);
                        checkFirstRadio = false;
                    }
                }
                input.append(radio);
            });
            if (checkFirstRadio) {
                input.find('input[type="radio"]').first().prop("checked", true);
            }
            break;
        }
        form.append(input);
        form.on("submit", function(e) {
            e.preventDefault();
            e.stopPropagation();
            promptDialog.find(".bootbox-accept").trigger("click");
        });
        if ($.trim(options.message) !== "") {
            var message = $(templates.promptMessage).html(options.message);
            form.prepend(message);
            options.message = form;
        } else {
            options.message = form;
        }
        promptDialog = exports.dialog(options);
        promptDialog.off("shown.bs.modal", focusPrimaryButton);
        promptDialog.on("shown.bs.modal", function() {
            input.focus();
        });
        if (shouldShow === true) {
            promptDialog.modal("show");
        }
        return promptDialog;
    };
    function mapArguments(args, properties) {
        var argn = args.length;
        var options = {};
        if (argn < 1 || argn > 2) {
            throw new Error("Invalid argument length");
        }
        if (argn === 2 || typeof args[0] === "string") {
            options[properties[0]] = args[0];
            options[properties[1]] = args[1];
        } else {
            options = args[0];
        }
        return options;
    }
    function mergeArguments(defaults, args, properties) {
        return $.extend(true, {}, defaults, mapArguments(args, properties));
    }
    function mergeDialogOptions(className, labels, properties, args) {
        var locale;
        if (args && args[0]) {
            locale = args[0].locale || defaults.locale;
            var swapButtons = args[0].swapButtonOrder || defaults.swapButtonOrder;
            if (swapButtons) {
                labels = labels.reverse();
            }
        }
        var baseOptions = {
            className: "bootbox-" + className,
            buttons: createLabels(labels, locale)
        };
        return validateButtons(mergeArguments(baseOptions, args, properties), labels);
    }
    function validateButtons(options, buttons) {
        var allowedButtons = {};
        each(buttons, function(key, value) {
            allowedButtons[value] = true;
        });
        each(options.buttons, function(key) {
            if (allowedButtons[key] === undefined) {
                throw new Error('button key "' + key + '" is not allowed (options are ' + buttons.join(" ") + ")");
            }
        });
        return options;
    }
    function createLabels(labels, locale) {
        var buttons = {};
        for (var i = 0, j = labels.length; i < j; i++) {
            var argument = labels[i];
            var key = argument.toLowerCase();
            var value = argument.toUpperCase();
            buttons[key] = {
                label: getText(value, locale)
            };
        }
        return buttons;
    }
    function getText(key, locale) {
        var labels = locales[locale];
        return labels ? labels[key] : locales.en[key];
    }
    function sanitize(options) {
        var buttons;
        var total;
        if (typeof options !== "object") {
            throw new Error("Please supply an object of options");
        }
        if (!options.message) {
            throw new Error('"message" option must not be null or an empty string.');
        }
        options = $.extend({}, defaults, options);
        if (!options.backdrop) {
            options.backdrop = options.backdrop === false || options.backdrop === 0 ? false : "static";
        } else {
            options.backdrop = typeof options.backdrop === "string" && options.backdrop.toLowerCase() === "static" ? "static" : true;
        }
        if (!options.buttons) {
            options.buttons = {};
        }
        buttons = options.buttons;
        total = getKeyLength(buttons);
        each(buttons, function(key, button, index) {
            if ($.isFunction(button)) {
                button = buttons[key] = {
                    callback: button
                };
            }
            if ($.type(button) !== "object") {
                throw new Error('button with key "' + key + '" must be an object');
            }
            if (!button.label) {
                button.label = key;
            }
            if (!button.className) {
                var isPrimary = false;
                if (options.swapButtonOrder) {
                    isPrimary = index === 0;
                } else {
                    isPrimary = index === total - 1;
                }
                if (total <= 2 && isPrimary) {
                    button.className = "btn-primary";
                } else {
                    button.className = "btn-secondary btn-default";
                }
            }
        });
        return options;
    }
    function getKeyLength(obj) {
        return Object.keys(obj).length;
    }
    function each(collection, iterator) {
        var index = 0;
        $.each(collection, function(key, value) {
            iterator(key, value, index++);
        });
    }
    function focusPrimaryButton(e) {
        e.data.dialog.find(".bootbox-accept").first().trigger("focus");
    }
    function destroyModal(e) {
        if (e.target === e.data.dialog[0]) {
            e.data.dialog.remove();
        }
    }
    function unbindModal(e) {
        if (e.target === e.data.dialog[0]) {
            e.data.dialog.off("escape.close.bb");
            e.data.dialog.off("click");
        }
    }
    function processCallback(e, dialog, callback) {
        e.stopPropagation();
        e.preventDefault();
        var preserveDialog = $.isFunction(callback) && callback.call(dialog, e) === false;
        if (!preserveDialog) {
            dialog.modal("hide");
        }
    }
    function minAndMaxAreValid(type, min, max) {
        var result = false;
        var minValid = true;
        var maxValid = true;
        if (type === "date") {
            if (min !== undefined && !(minValid = dateIsValid(min))) {
                console.warn('Browsers which natively support the "date" input type expect date values to be of the form "YYYY-MM-DD" (see ISO-8601 https://www.iso.org/iso-8601-date-and-time-format.html). Bootbox does not enforce this rule, but your min value may not be enforced by this browser.');
            } else if (max !== undefined && !(maxValid = dateIsValid(max))) {
                console.warn('Browsers which natively support the "date" input type expect date values to be of the form "YYYY-MM-DD" (see ISO-8601 https://www.iso.org/iso-8601-date-and-time-format.html). Bootbox does not enforce this rule, but your max value may not be enforced by this browser.');
            }
        } else if (type === "time") {
            if (min !== undefined && !(minValid = timeIsValid(min))) {
                throw new Error('"min" is not a valid time. See https://www.w3.org/TR/2012/WD-html-markup-20120315/datatypes.html#form.data.time for more information.');
            } else if (max !== undefined && !(maxValid = timeIsValid(max))) {
                throw new Error('"max" is not a valid time. See https://www.w3.org/TR/2012/WD-html-markup-20120315/datatypes.html#form.data.time for more information.');
            }
        } else {
            if (min !== undefined && isNaN(min)) {
                minValid = false;
                throw new Error('"min" must be a valid number. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-min for more information.');
            }
            if (max !== undefined && isNaN(max)) {
                maxValid = false;
                throw new Error('"max" must be a valid number. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-max for more information.');
            }
        }
        if (minValid && maxValid) {
            if (max <= min) {
                throw new Error('"max" must be greater than "min". See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-max for more information.');
            } else {
                result = true;
            }
        }
        return result;
    }
    function timeIsValid(value) {
        return /([01][0-9]|2[0-3]):[0-5][0-9]?:[0-5][0-9]/.test(value);
    }
    function dateIsValid(value) {
        return /(\d{4})-(\d{2})-(\d{2})/.test(value);
    }
    return exports;
});

(function(factory) {
    if (typeof define === "function" && define.amd) {
        define([ "jquery" ], factory);
    } else if (typeof exports === "object") {
        factory(require("jquery"));
    } else {
        factory(jQuery);
    }
})(function($) {
    var defaults = {
        element: "body",
        position: null,
        type: "info",
        allow_dismiss: true,
        allow_duplicates: true,
        newest_on_top: false,
        showProgressbar: false,
        placement: {
            from: "top",
            align: "right"
        },
        offset: 20,
        spacing: 10,
        z_index: 9999999,
        delay: 5e3,
        timer: 1e3,
        url_target: "_blank",
        mouse_over: null,
        animate: {
            enter: "animated fadeInDown",
            exit: "animated fadeOutUp"
        },
        onShow: null,
        onShown: null,
        onClose: null,
        onClosed: null,
        onClick: null,
        icon_type: "class",
        template: [ '<div data-notify="container" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-animation="false">', '<div class="toast-header">', '<span data-notify="icon" class="me-2 text-{0}"></span>', '<span class="me-auto fw-bold" data-notify="title">{1}</span>', '<button type="button" class="ms-2 mb-1 btn-close" data-bs-dismiss="toast" data-notify="dismiss" aria-label="Close">', "</button>", "</div>", '<div class="toast-body" data-notify="message">', "{2}", '<div class="progress" data-notify="progressbar">', '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>', "</div>", "</div>" ].join("")
    };
    String.format = function() {
        var args = arguments;
        var str = arguments[0];
        return str.replace(/(\{\{\d\}\}|\{\d\})/g, function(str) {
            if (str.substring(0, 2) === "{{") return str;
            var num = parseInt(str.match(/\d/)[0]);
            return args[num + 1];
        });
    };
    function isDuplicateNotification(notification) {
        var isDupe = false;
        $('[data-notify="container"]').each(function(i, el) {
            var $el = $(el);
            var title = $el.find('[data-notify="title"]').html().trim();
            var message = $el.find('[data-notify="message"]').html().trim();
            var isSameTitle = title === $("<div>" + notification.settings.content.title + "</div>").html().trim();
            var isSameMsg = message === $("<div>" + notification.settings.content.message + "</div>").html().trim();
            var isSameType = $el.hasClass("alert-" + notification.settings.type);
            if (isSameTitle && isSameMsg && isSameType) {
                isDupe = true;
            }
            return !isDupe;
        });
        return isDupe;
    }
    function Notify(element, content, options) {
        var contentObj = {
            content: {
                message: typeof content === "object" ? content.message : content,
                title: content.title ? content.title : "",
                icon: content.icon ? content.icon : "",
                url: content.url ? content.url : "#",
                target: content.target ? content.target : "-"
            }
        };
        options = $.extend(true, {}, contentObj, options);
        this.settings = $.extend(true, {}, defaults, options);
        this._defaults = defaults;
        if (this.settings.content.target === "-") {
            this.settings.content.target = this.settings.url_target;
        }
        this.animations = {
            start: "webkitAnimationStart oanimationstart MSAnimationStart animationstart",
            end: "webkitAnimationEnd oanimationend MSAnimationEnd animationend"
        };
        if (typeof this.settings.offset === "number") {
            this.settings.offset = {
                x: this.settings.offset,
                y: this.settings.offset
            };
        }
        if (this.settings.allow_duplicates || !this.settings.allow_duplicates && !isDuplicateNotification(this)) {
            this.init();
        }
    }
    $.extend(Notify.prototype, {
        init: function() {
            var self = this;
            this.buildNotify();
            if (this.settings.content.icon) {
                this.setIcon();
            }
            if (this.settings.content.url != "#") {
                this.styleURL();
            }
            this.placement();
            this.bind();
            this.notify = {
                $ele: this.$ele,
                update: function(command, update) {
                    var commands = {};
                    if (typeof command === "string") {
                        commands[command] = update;
                    } else {
                        commands = command;
                    }
                    for (var cmd in commands) {
                        switch (cmd) {
                          case "type":
                            this.$ele.removeClass("alert-" + self.settings.type);
                            this.$ele.find('[data-notify="progressbar"] > .progress-bar').removeClass("progress-bar-" + self.settings.type);
                            self.settings.type = commands[cmd];
                            this.$ele.addClass("alert-" + commands[cmd]).find('[data-notify="progressbar"] > .progress-bar').addClass("progress-bar-" + commands[cmd]);
                            break;

                          case "icon":
                            var $icon = this.$ele.find('[data-notify="icon"]');
                            if (self.settings.icon_type.toLowerCase() === "class") {
                                $icon.removeClass(self.settings.content.icon).addClass(commands[cmd]);
                            } else {
                                if (!$icon.is("img")) {
                                    $icon.find("img");
                                }
                                $icon.attr("src", commands[cmd]);
                            }
                            self.settings.content.icon = commands[command];
                            break;

                          case "progress":
                            var newDelay = self.settings.delay - self.settings.delay * (commands[cmd] / 100);
                            this.$ele.data("notify-delay", newDelay);
                            this.$ele.find('[data-notify="progressbar"] > div').attr("aria-valuenow", commands[cmd]).css("width", commands[cmd] + "%");
                            break;

                          case "url":
                            this.$ele.find('[data-notify="url"]').attr("href", commands[cmd]);
                            break;

                          case "target":
                            this.$ele.find('[data-notify="url"]').attr("target", commands[cmd]);
                            break;

                          default:
                            this.$ele.find('[data-notify="' + cmd + '"]').html(commands[cmd]);
                        }
                    }
                    var posX = this.$ele.outerHeight() + parseInt(self.settings.spacing) + parseInt(self.settings.offset.y);
                    self.reposition(posX);
                },
                close: function() {
                    self.close();
                }
            };
        },
        buildNotify: function() {
            var content = this.settings.content;
            this.$ele = $(String.format(this.settings.template, this.settings.type, content.title, content.message, content.url, content.target));
            this.$ele.attr("data-notify-position", this.settings.placement.from + "-" + this.settings.placement.align);
            if (!this.settings.allow_dismiss) {
                this.$ele.find('[data-notify="dismiss"]').css("display", "none");
            }
            if (this.settings.delay <= 0 && !this.settings.showProgressbar || !this.settings.showProgressbar) {
                this.$ele.find('[data-notify="progressbar"]').remove();
            }
        },
        setIcon: function() {
            if (this.settings.icon_type.toLowerCase() === "class") {
                this.$ele.find('[data-notify="icon"]').addClass(this.settings.content.icon);
            } else {
                if (this.$ele.find('[data-notify="icon"]').is("img")) {
                    this.$ele.find('[data-notify="icon"]').attr("src", this.settings.content.icon);
                } else {
                    this.$ele.find('[data-notify="icon"]').append('<img src="' + this.settings.content.icon + '" alt="Notify Icon" />');
                }
            }
        },
        styleDismiss: function() {
            this.$ele.find('[data-notify="dismiss"]').css({
                position: "absolute",
                right: "10px",
                top: "5px",
                zIndex: this.settings.z_index + 2
            });
        },
        styleURL: function() {
            this.$ele.find('[data-notify="url"]').css({
                backgroundImage: "url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)",
                height: "100%",
                left: 0,
                position: "absolute",
                top: 0,
                width: "100%",
                zIndex: this.settings.z_index + 1
            });
        },
        placement: function() {
            var self = this, offsetAmt = this.settings.offset.y, css = {
                display: "inline-block",
                margin: "0px auto",
                opacity: 100,
                "min-width": "300px",
                position: this.settings.position ? this.settings.position : this.settings.element === "body" ? "fixed" : "absolute",
                transition: "all .5s ease-in-out",
                zIndex: this.settings.z_index
            }, hasAnimation = false, settings = this.settings;
            $('[data-notify-position="' + this.settings.placement.from + "-" + this.settings.placement.align + '"]:not([data-closing="true"])').each(function() {
                offsetAmt = Math.max(offsetAmt, parseInt($(this).css(settings.placement.from)) + parseInt($(this).outerHeight()) + parseInt(settings.spacing));
            });
            if (this.settings.newest_on_top === true) {
                offsetAmt = this.settings.offset.y;
            }
            css[this.settings.placement.from] = offsetAmt + "px";
            switch (this.settings.placement.align) {
              case "left":
              case "right":
                css[this.settings.placement.align] = this.settings.offset.x + "px";
                break;

              case "center":
                css.left = 0;
                css.right = 0;
                break;
            }
            this.$ele.css(css).addClass(this.settings.animate.enter);
            $.each(Array("webkit-", "moz-", "o-", "ms-", ""), function(index, prefix) {
                self.$ele[0].style[prefix + "AnimationIterationCount"] = 1;
            });
            $(this.settings.element).append(this.$ele);
            if (this.settings.newest_on_top === true) {
                offsetAmt = parseInt(offsetAmt) + parseInt(this.settings.spacing) + this.$ele.outerHeight();
                this.reposition(offsetAmt);
            }
            if ($.isFunction(self.settings.onShow)) {
                self.settings.onShow.call(this.$ele);
            }
            this.$ele.one(this.animations.start, function() {
                hasAnimation = true;
            }).one(this.animations.end, function() {
                self.$ele.removeClass(self.settings.animate.enter);
                if ($.isFunction(self.settings.onShown)) {
                    self.settings.onShown.call(this);
                }
            });
            setTimeout(function() {
                if (!hasAnimation) {
                    if ($.isFunction(self.settings.onShown)) {
                        self.settings.onShown.call(this);
                    }
                }
            }, 600);
        },
        bind: function() {
            var self = this;
            this.$ele.find('[data-notify="dismiss"]').on("click", function() {
                self.close();
            });
            if ($.isFunction(self.settings.onClick)) {
                this.$ele.on("click", function(event) {
                    if (event.target != self.$ele.find('[data-notify="dismiss"]')[0]) {
                        self.settings.onClick.call(this, event);
                    }
                });
            }
            this.$ele.mouseover(function() {
                $(this).data("data-hover", "true");
            }).mouseout(function() {
                $(this).data("data-hover", "false");
            });
            this.$ele.data("data-hover", "false");
            if (this.settings.delay > 0) {
                self.$ele.data("notify-delay", self.settings.delay);
                var timer = setInterval(function() {
                    var delay = parseInt(self.$ele.data("notify-delay")) - self.settings.timer;
                    if (self.$ele.data("data-hover") === "false" && self.settings.mouse_over === "pause" || self.settings.mouse_over != "pause") {
                        var percent = (self.settings.delay - delay) / self.settings.delay * 100;
                        self.$ele.data("notify-delay", delay);
                        self.$ele.find('[data-notify="progressbar"] > div').attr("aria-valuenow", percent).css("width", percent + "%");
                    }
                    if (delay <= -self.settings.timer) {
                        clearInterval(timer);
                        self.close();
                    }
                }, self.settings.timer);
            }
        },
        close: function() {
            var self = this, posX = parseInt(this.$ele.css(this.settings.placement.from)), hasAnimation = false;
            this.$ele.attr("data-closing", "true").addClass(this.settings.animate.exit);
            self.reposition(posX);
            if ($.isFunction(self.settings.onClose)) {
                self.settings.onClose.call(this.$ele);
            }
            this.$ele.one(this.animations.start, function() {
                hasAnimation = true;
            }).one(this.animations.end, function() {
                $(this).remove();
                if ($.isFunction(self.settings.onClosed)) {
                    self.settings.onClosed.call(this);
                }
            });
            setTimeout(function() {
                if (!hasAnimation) {
                    self.$ele.remove();
                    if ($.isFunction(self.settings.onClosed)) {
                        self.settings.onClosed.call(this);
                    }
                }
            }, 600);
        },
        reposition: function(posX) {
            var self = this, notifies = '[data-notify-position="' + this.settings.placement.from + "-" + this.settings.placement.align + '"]:not([data-closing="true"])', $elements = this.$ele.nextAll(notifies);
            if (this.settings.newest_on_top === true) {
                $elements = this.$ele.prevAll(notifies);
            }
            $elements.each(function() {
                $(this).css(self.settings.placement.from, posX);
                posX = parseInt(posX) + parseInt(self.settings.spacing) + $(this).outerHeight();
            });
        }
    });
    $.notify = function(content, options) {
        var plugin = new Notify(this, content, options);
        return plugin.notify;
    };
    $.notifyDefaults = function(options) {
        defaults = $.extend(true, {}, defaults, options);
        return defaults;
    };
    $.notifyClose = function(selector) {
        if (typeof selector === "undefined" || selector === "all") {
            $("[data-notify]").find('[data-notify="dismiss"]').trigger("click");
        } else if (selector === "success" || selector === "info" || selector === "warning" || selector === "danger") {
            $(".alert-" + selector + "[data-notify]").find('[data-notify="dismiss"]').trigger("click");
        } else if (selector) {
            $(selector + "[data-notify]").find('[data-notify="dismiss"]').trigger("click");
        } else {
            $('[data-notify-position="' + selector + '"]').find('[data-notify="dismiss"]').trigger("click");
        }
    };
    $.notifyCloseExcept = function(selector) {
        if (selector === "success" || selector === "info" || selector === "warning" || selector === "danger") {
            $("[data-notify]").not(".alert-" + selector).find('[data-notify="dismiss"]').trigger("click");
        } else {
            $("[data-notify]").not(selector).find('[data-notify="dismiss"]').trigger("click");
        }
    };
});

(function(factory) {
    if (typeof define === "function" && define.amd) {
        define([ "jquery" ], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = function(root, jQuery) {
            if (jQuery === undefined) {
                if (typeof window !== "undefined") {
                    jQuery = require("jquery");
                } else {
                    jQuery = require("jquery")(root);
                }
            }
            factory(jQuery);
            return jQuery;
        };
    } else {
        factory(jQuery);
    }
})(function($) {
    "use strict";
    var _currentSpinnerId = 0;
    $.fn.TouchSpin = function(options) {
        var defaults = {
            min: 0,
            max: 100,
            initval: "",
            replacementval: "",
            firstclickvalueifempty: null,
            step: 1,
            decimals: 0,
            stepinterval: 100,
            forcestepdivisibility: "round",
            stepintervaldelay: 500,
            verticalbuttons: false,
            verticalup: "+",
            verticaldown: "-",
            verticalupclass: "",
            verticaldownclass: "",
            prefix: "",
            postfix: "",
            prefix_extraclass: "",
            postfix_extraclass: "",
            booster: true,
            boostat: 10,
            maxboostedstep: false,
            mousewheel: true,
            buttondown_class: "btn btn-secondary",
            buttonup_class: "btn btn-secondary",
            buttondown_txt: "-",
            buttonup_txt: "+",
            callback_before_calculation: function(value) {
                return value;
            },
            callback_after_calculation: function(value) {
                return value;
            }
        };
        var attributeMap = {
            min: "min",
            max: "max",
            initval: "init-val",
            replacementval: "replacement-val",
            firstclickvalueifempty: "first-click-value-if-empty",
            step: "step",
            decimals: "decimals",
            stepinterval: "step-interval",
            verticalbuttons: "vertical-buttons",
            verticalupclass: "vertical-up-class",
            verticaldownclass: "vertical-down-class",
            forcestepdivisibility: "force-step-divisibility",
            stepintervaldelay: "step-interval-delay",
            prefix: "prefix",
            postfix: "postfix",
            prefix_extraclass: "prefix-extra-class",
            postfix_extraclass: "postfix-extra-class",
            booster: "booster",
            boostat: "boostat",
            maxboostedstep: "max-boosted-step",
            mousewheel: "mouse-wheel",
            buttondown_class: "button-down-class",
            buttonup_class: "button-up-class",
            buttondown_txt: "button-down-txt",
            buttonup_txt: "button-up-txt"
        };
        return this.each(function() {
            var settings, originalinput = $(this), originalinput_data = originalinput.data(), _detached_prefix, _detached_postfix, container, elements, value, downSpinTimer, upSpinTimer, downDelayTimeout, upDelayTimeout, spincount = 0, spinning = false;
            init();
            function init() {
                if (originalinput.data("alreadyinitialized")) {
                    return;
                }
                originalinput.data("alreadyinitialized", true);
                _currentSpinnerId += 1;
                originalinput.data("spinnerid", _currentSpinnerId);
                if (!originalinput.is("input")) {
                    console.log("Must be an input.");
                    return;
                }
                _initSettings();
                _setInitval();
                _checkValue();
                _buildHtml();
                _initElements();
                _hideEmptyPrefixPostfix();
                _bindEvents();
                _bindEventsInterface();
            }
            function _setInitval() {
                if (settings.initval !== "" && originalinput.val() === "") {
                    originalinput.val(settings.initval);
                }
            }
            function changeSettings(newsettings) {
                _updateSettings(newsettings);
                _checkValue();
                var value = elements.input.val();
                if (value !== "") {
                    value = Number(settings.callback_before_calculation(elements.input.val()));
                    elements.input.val(settings.callback_after_calculation(Number(value).toFixed(settings.decimals)));
                }
            }
            function _initSettings() {
                settings = $.extend({}, defaults, originalinput_data, _parseAttributes(), options);
            }
            function _parseAttributes() {
                var data = {};
                $.each(attributeMap, function(key, value) {
                    var attrName = "bts-" + value + "";
                    if (originalinput.is("[data-" + attrName + "]")) {
                        data[key] = originalinput.data(attrName);
                    }
                });
                return data;
            }
            function _destroy() {
                var $parent = originalinput.parent();
                stopSpin();
                originalinput.off(".touchspin");
                if ($parent.hasClass("bootstrap-touchspin-injected")) {
                    originalinput.siblings().remove();
                    originalinput.unwrap();
                } else {
                    $(".bootstrap-touchspin-injected", $parent).remove();
                    $parent.removeClass("bootstrap-touchspin");
                }
                originalinput.data("alreadyinitialized", false);
            }
            function _updateSettings(newsettings) {
                settings = $.extend({}, settings, newsettings);
                if (newsettings.postfix) {
                    var $postfix = originalinput.parent().find(".bootstrap-touchspin-postfix");
                    if ($postfix.length === 0) {
                        _detached_postfix.insertAfter(originalinput);
                    }
                    originalinput.parent().find(".bootstrap-touchspin-postfix .input-group-text").text(newsettings.postfix);
                }
                if (newsettings.prefix) {
                    var $prefix = originalinput.parent().find(".bootstrap-touchspin-prefix");
                    if ($prefix.length === 0) {
                        _detached_prefix.insertBefore(originalinput);
                    }
                    originalinput.parent().find(".bootstrap-touchspin-prefix .input-group-text").text(newsettings.prefix);
                }
                _hideEmptyPrefixPostfix();
            }
            function _buildHtml() {
                var initval = originalinput.val(), parentelement = originalinput.parent();
                if (initval !== "") {
                    initval = settings.callback_after_calculation(Number(initval).toFixed(settings.decimals));
                }
                originalinput.data("initvalue", initval).val(initval);
                originalinput.addClass("form-control");
                if (parentelement.hasClass("input-group")) {
                    _advanceInputGroup(parentelement);
                } else {
                    _buildInputGroup();
                }
            }
            function _advanceInputGroup(parentelement) {
                parentelement.addClass("bootstrap-touchspin");
                var prev = originalinput.prev(), next = originalinput.next();
                var downhtml, uphtml, prefixhtml = '<span class="input-group-text">' + settings.prefix + "</span>", postfixhtml = '<span class="input-group-text">' + settings.postfix + "</span>";
                if (prev.hasClass("input-group-btn") || prev.hasClass("input-group-prepend")) {
                    downhtml = '<button class="' + settings.buttondown_class + ' bootstrap-touchspin-down bootstrap-touchspin-injected" type="button">' + settings.buttondown_txt + "</button>";
                    prev.append(downhtml);
                } else {
                    downhtml = '<button class="' + settings.buttondown_class + ' bootstrap-touchspin-down" type="button">' + settings.buttondown_txt + "</button>";
                    $(downhtml).insertBefore(originalinput);
                }
                if (next.hasClass("input-group-btn") || next.hasClass("input-group-append")) {
                    uphtml = '<button class="' + settings.buttonup_class + ' bootstrap-touchspin-up bootstrap-touchspin-injected" type="button">' + settings.buttonup_txt + "</button>";
                    next.prepend(uphtml);
                } else {
                    uphtml = '<button class="' + settings.buttonup_class + ' bootstrap-touchspin-up" type="button">' + settings.buttonup_txt + "</button>";
                    $(uphtml).insertAfter(originalinput);
                }
                container = parentelement;
            }
            function _buildInputGroup() {
                var html;
                var inputGroupSize = "";
                if (originalinput.hasClass("input-sm")) {
                    inputGroupSize = "input-group-sm";
                }
                if (originalinput.hasClass("input-lg")) {
                    inputGroupSize = "input-group-lg";
                }
                if (settings.verticalbuttons) {
                    html = '<div class="input-group ' + inputGroupSize + ' bootstrap-touchspin bootstrap-touchspin-injected"><span class="input-group-text">' + settings.prefix + '</span><span class="input-group-text">' + settings.postfix + '</span><span class="input-group-btn-vertical"><button class="' + settings.buttondown_class + " bootstrap-touchspin-up " + settings.verticalupclass + '" type="button">' + settings.verticalup + '</button><button class="' + settings.buttonup_class + " bootstrap-touchspin-down " + settings.verticaldownclass + '" type="button">' + settings.verticaldown + "</button></span></div>";
                } else {
                    html = '<div class="input-group bootstrap-touchspin bootstrap-touchspin-injected"><button class="' + settings.buttondown_class + ' bootstrap-touchspin-down" type="button">' + settings.buttondown_txt + '</button><span class="input-group-addon bootstrap-touchspin-prefix input-group-prepend"><span class="input-group-text">' + settings.prefix + '</span></span><span class="input-group-addon bootstrap-touchspin-postfix input-group-append"><span class="input-group-text">' + settings.postfix + '</span></span><button class="' + settings.buttonup_class + ' bootstrap-touchspin-up" type="button">' + settings.buttonup_txt + "</button></div>";
                }
                container = $(html).insertBefore(originalinput);
                $(".bootstrap-touchspin-prefix", container).after(originalinput);
                if (originalinput.hasClass("input-sm")) {
                    container.addClass("input-group-sm");
                } else if (originalinput.hasClass("input-lg")) {
                    container.addClass("input-group-lg");
                }
            }
            function _initElements() {
                elements = {
                    down: $(".bootstrap-touchspin-down", container),
                    up: $(".bootstrap-touchspin-up", container),
                    input: $("input", container),
                    prefix: $(".bootstrap-touchspin-prefix", container).addClass(settings.prefix_extraclass),
                    postfix: $(".bootstrap-touchspin-postfix", container).addClass(settings.postfix_extraclass)
                };
            }
            function _hideEmptyPrefixPostfix() {
                if (settings.prefix === "") {
                    _detached_prefix = elements.prefix.detach();
                }
                if (settings.postfix === "") {
                    _detached_postfix = elements.postfix.detach();
                }
            }
            function _bindEvents() {
                originalinput.on("keydown.touchspin", function(ev) {
                    var code = ev.keyCode || ev.which;
                    if (code === 38) {
                        if (spinning !== "up") {
                            upOnce();
                            startUpSpin();
                        }
                        ev.preventDefault();
                    } else if (code === 40) {
                        if (spinning !== "down") {
                            downOnce();
                            startDownSpin();
                        }
                        ev.preventDefault();
                    }
                });
                originalinput.on("keyup.touchspin", function(ev) {
                    var code = ev.keyCode || ev.which;
                    if (code === 38) {
                        stopSpin();
                    } else if (code === 40) {
                        stopSpin();
                    }
                });
                originalinput.on("blur.touchspin", function() {
                    _checkValue();
                    originalinput.val(settings.callback_after_calculation(originalinput.val()));
                });
                elements.down.on("keydown", function(ev) {
                    var code = ev.keyCode || ev.which;
                    if (code === 32 || code === 13) {
                        if (spinning !== "down") {
                            downOnce();
                            startDownSpin();
                        }
                        ev.preventDefault();
                    }
                });
                elements.down.on("keyup.touchspin", function(ev) {
                    var code = ev.keyCode || ev.which;
                    if (code === 32 || code === 13) {
                        stopSpin();
                    }
                });
                elements.up.on("keydown.touchspin", function(ev) {
                    var code = ev.keyCode || ev.which;
                    if (code === 32 || code === 13) {
                        if (spinning !== "up") {
                            upOnce();
                            startUpSpin();
                        }
                        ev.preventDefault();
                    }
                });
                elements.up.on("keyup.touchspin", function(ev) {
                    var code = ev.keyCode || ev.which;
                    if (code === 32 || code === 13) {
                        stopSpin();
                    }
                });
                elements.down.on("mousedown.touchspin", function(ev) {
                    elements.down.off("touchstart.touchspin");
                    if (originalinput.is(":disabled")) {
                        return;
                    }
                    downOnce();
                    startDownSpin();
                    ev.preventDefault();
                    ev.stopPropagation();
                });
                elements.down.on("touchstart.touchspin", function(ev) {
                    elements.down.off("mousedown.touchspin");
                    if (originalinput.is(":disabled")) {
                        return;
                    }
                    downOnce();
                    startDownSpin();
                    ev.preventDefault();
                    ev.stopPropagation();
                });
                elements.up.on("mousedown.touchspin", function(ev) {
                    elements.up.off("touchstart.touchspin");
                    if (originalinput.is(":disabled")) {
                        return;
                    }
                    upOnce();
                    startUpSpin();
                    ev.preventDefault();
                    ev.stopPropagation();
                });
                elements.up.on("touchstart.touchspin", function(ev) {
                    elements.up.off("mousedown.touchspin");
                    if (originalinput.is(":disabled")) {
                        return;
                    }
                    upOnce();
                    startUpSpin();
                    ev.preventDefault();
                    ev.stopPropagation();
                });
                elements.up.on("mouseup.touchspin mouseout.touchspin touchleave.touchspin touchend.touchspin touchcancel.touchspin", function(ev) {
                    if (!spinning) {
                        return;
                    }
                    ev.stopPropagation();
                    stopSpin();
                });
                elements.down.on("mouseup.touchspin mouseout.touchspin touchleave.touchspin touchend.touchspin touchcancel.touchspin", function(ev) {
                    if (!spinning) {
                        return;
                    }
                    ev.stopPropagation();
                    stopSpin();
                });
                elements.down.on("mousemove.touchspin touchmove.touchspin", function(ev) {
                    if (!spinning) {
                        return;
                    }
                    ev.stopPropagation();
                    ev.preventDefault();
                });
                elements.up.on("mousemove.touchspin touchmove.touchspin", function(ev) {
                    if (!spinning) {
                        return;
                    }
                    ev.stopPropagation();
                    ev.preventDefault();
                });
                originalinput.on("mousewheel.touchspin DOMMouseScroll.touchspin", function(ev) {
                    if (!settings.mousewheel || !originalinput.is(":focus")) {
                        return;
                    }
                    var delta = ev.originalEvent.wheelDelta || -ev.originalEvent.deltaY || -ev.originalEvent.detail;
                    ev.stopPropagation();
                    ev.preventDefault();
                    if (delta < 0) {
                        downOnce();
                    } else {
                        upOnce();
                    }
                });
            }
            function _bindEventsInterface() {
                originalinput.on("touchspin.destroy", function() {
                    _destroy();
                });
                originalinput.on("touchspin.uponce", function() {
                    stopSpin();
                    upOnce();
                });
                originalinput.on("touchspin.downonce", function() {
                    stopSpin();
                    downOnce();
                });
                originalinput.on("touchspin.startupspin", function() {
                    startUpSpin();
                });
                originalinput.on("touchspin.startdownspin", function() {
                    startDownSpin();
                });
                originalinput.on("touchspin.stopspin", function() {
                    stopSpin();
                });
                originalinput.on("touchspin.updatesettings", function(e, newsettings) {
                    changeSettings(newsettings);
                });
            }
            function _forcestepdivisibility(value) {
                switch (settings.forcestepdivisibility) {
                  case "round":
                    return (Math.round(value / settings.step) * settings.step).toFixed(settings.decimals);

                  case "floor":
                    return (Math.floor(value / settings.step) * settings.step).toFixed(settings.decimals);

                  case "ceil":
                    return (Math.ceil(value / settings.step) * settings.step).toFixed(settings.decimals);

                  default:
                    return value.toFixed(settings.decimals);
                }
            }
            function _checkValue() {
                var val, parsedval, returnval;
                val = settings.callback_before_calculation(originalinput.val());
                if (val === "") {
                    if (settings.replacementval !== "") {
                        originalinput.val(settings.replacementval);
                        originalinput.trigger("change");
                    }
                    return;
                }
                if (settings.decimals > 0 && val === ".") {
                    return;
                }
                parsedval = parseFloat(val);
                if (isNaN(parsedval)) {
                    if (settings.replacementval !== "") {
                        parsedval = settings.replacementval;
                    } else {
                        parsedval = 0;
                    }
                }
                returnval = parsedval;
                if (parsedval.toString() !== val) {
                    returnval = parsedval;
                }
                if (settings.min !== null && parsedval < settings.min) {
                    returnval = settings.min;
                }
                if (settings.max !== null && parsedval > settings.max) {
                    returnval = settings.max;
                }
                returnval = _forcestepdivisibility(returnval);
                if (Number(val).toString() !== returnval.toString()) {
                    originalinput.val(returnval);
                    originalinput.trigger("change");
                }
            }
            function _getBoostedStep() {
                if (!settings.booster) {
                    return settings.step;
                } else {
                    var boosted = Math.pow(2, Math.floor(spincount / settings.boostat)) * settings.step;
                    if (settings.maxboostedstep) {
                        if (boosted > settings.maxboostedstep) {
                            boosted = settings.maxboostedstep;
                            value = Math.round(value / boosted) * boosted;
                        }
                    }
                    return Math.max(settings.step, boosted);
                }
            }
            function valueIfIsNaN() {
                if (typeof settings.firstclickvalueifempty === "number") {
                    return settings.firstclickvalueifempty;
                } else {
                    return (settings.min + settings.max) / 2;
                }
            }
            function upOnce() {
                _checkValue();
                value = parseFloat(settings.callback_before_calculation(elements.input.val()));
                var initvalue = value;
                var boostedstep;
                if (isNaN(value)) {
                    value = valueIfIsNaN();
                } else {
                    boostedstep = _getBoostedStep();
                    value = value + boostedstep;
                }
                if (settings.max !== null && value > settings.max) {
                    value = settings.max;
                    originalinput.trigger("touchspin.on.max");
                    stopSpin();
                }
                elements.input.val(settings.callback_after_calculation(Number(value).toFixed(settings.decimals)));
                if (initvalue !== value) {
                    originalinput.trigger("change");
                }
            }
            function downOnce() {
                _checkValue();
                value = parseFloat(settings.callback_before_calculation(elements.input.val()));
                var initvalue = value;
                var boostedstep;
                if (isNaN(value)) {
                    value = valueIfIsNaN();
                } else {
                    boostedstep = _getBoostedStep();
                    value = value - boostedstep;
                }
                if (settings.min !== null && value < settings.min) {
                    value = settings.min;
                    originalinput.trigger("touchspin.on.min");
                    stopSpin();
                }
                elements.input.val(settings.callback_after_calculation(Number(value).toFixed(settings.decimals)));
                if (initvalue !== value) {
                    originalinput.trigger("change");
                }
            }
            function startDownSpin() {
                stopSpin();
                spincount = 0;
                spinning = "down";
                originalinput.trigger("touchspin.on.startspin");
                originalinput.trigger("touchspin.on.startdownspin");
                downDelayTimeout = setTimeout(function() {
                    downSpinTimer = setInterval(function() {
                        spincount++;
                        downOnce();
                    }, settings.stepinterval);
                }, settings.stepintervaldelay);
            }
            function startUpSpin() {
                stopSpin();
                spincount = 0;
                spinning = "up";
                originalinput.trigger("touchspin.on.startspin");
                originalinput.trigger("touchspin.on.startupspin");
                upDelayTimeout = setTimeout(function() {
                    upSpinTimer = setInterval(function() {
                        spincount++;
                        upOnce();
                    }, settings.stepinterval);
                }, settings.stepintervaldelay);
            }
            function stopSpin() {
                clearTimeout(downDelayTimeout);
                clearTimeout(upDelayTimeout);
                clearInterval(downSpinTimer);
                clearInterval(upSpinTimer);
                switch (spinning) {
                  case "up":
                    originalinput.trigger("touchspin.on.stopupspin");
                    originalinput.trigger("touchspin.on.stopspin");
                    break;

                  case "down":
                    originalinput.trigger("touchspin.on.stopdownspin");
                    originalinput.trigger("touchspin.on.stopspin");
                    break;
                }
                spincount = 0;
                spinning = false;
            }
        });
    };
});

(function(factory) {
    if (typeof define === "function" && define.amd) {
        define([ "jquery" ], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = function(root, jQuery) {
            if (jQuery === undefined) {
                if (typeof window !== "undefined") {
                    jQuery = require("jquery");
                } else {
                    jQuery = require("jquery")(root);
                }
            }
            factory(jQuery);
            return jQuery;
        };
    } else {
        factory(jQuery);
    }
})(function(jQuery) {
    var S2 = function() {
        if (jQuery && jQuery.fn && jQuery.fn.select2 && jQuery.fn.select2.amd) {
            var S2 = jQuery.fn.select2.amd;
        }
        var S2;
        (function() {
            if (!S2 || !S2.requirejs) {
                if (!S2) {
                    S2 = {};
                } else {
                    require = S2;
                }
                var requirejs, require, define;
                (function(undef) {
                    var main, req, makeMap, handlers, defined = {}, waiting = {}, config = {}, defining = {}, hasOwn = Object.prototype.hasOwnProperty, aps = [].slice, jsSuffixRegExp = /\.js$/;
                    function hasProp(obj, prop) {
                        return hasOwn.call(obj, prop);
                    }
                    function normalize(name, baseName) {
                        var nameParts, nameSegment, mapValue, foundMap, lastIndex, foundI, foundStarMap, starI, i, j, part, normalizedBaseParts, baseParts = baseName && baseName.split("/"), map = config.map, starMap = map && map["*"] || {};
                        if (name) {
                            name = name.split("/");
                            lastIndex = name.length - 1;
                            if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                                name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, "");
                            }
                            if (name[0].charAt(0) === "." && baseParts) {
                                normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                                name = normalizedBaseParts.concat(name);
                            }
                            for (i = 0; i < name.length; i++) {
                                part = name[i];
                                if (part === ".") {
                                    name.splice(i, 1);
                                    i -= 1;
                                } else if (part === "..") {
                                    if (i === 0 || i === 1 && name[2] === ".." || name[i - 1] === "..") {
                                        continue;
                                    } else if (i > 0) {
                                        name.splice(i - 1, 2);
                                        i -= 2;
                                    }
                                }
                            }
                            name = name.join("/");
                        }
                        if ((baseParts || starMap) && map) {
                            nameParts = name.split("/");
                            for (i = nameParts.length; i > 0; i -= 1) {
                                nameSegment = nameParts.slice(0, i).join("/");
                                if (baseParts) {
                                    for (j = baseParts.length; j > 0; j -= 1) {
                                        mapValue = map[baseParts.slice(0, j).join("/")];
                                        if (mapValue) {
                                            mapValue = mapValue[nameSegment];
                                            if (mapValue) {
                                                foundMap = mapValue;
                                                foundI = i;
                                                break;
                                            }
                                        }
                                    }
                                }
                                if (foundMap) {
                                    break;
                                }
                                if (!foundStarMap && starMap && starMap[nameSegment]) {
                                    foundStarMap = starMap[nameSegment];
                                    starI = i;
                                }
                            }
                            if (!foundMap && foundStarMap) {
                                foundMap = foundStarMap;
                                foundI = starI;
                            }
                            if (foundMap) {
                                nameParts.splice(0, foundI, foundMap);
                                name = nameParts.join("/");
                            }
                        }
                        return name;
                    }
                    function makeRequire(relName, forceSync) {
                        return function() {
                            var args = aps.call(arguments, 0);
                            if (typeof args[0] !== "string" && args.length === 1) {
                                args.push(null);
                            }
                            return req.apply(undef, args.concat([ relName, forceSync ]));
                        };
                    }
                    function makeNormalize(relName) {
                        return function(name) {
                            return normalize(name, relName);
                        };
                    }
                    function makeLoad(depName) {
                        return function(value) {
                            defined[depName] = value;
                        };
                    }
                    function callDep(name) {
                        if (hasProp(waiting, name)) {
                            var args = waiting[name];
                            delete waiting[name];
                            defining[name] = true;
                            main.apply(undef, args);
                        }
                        if (!hasProp(defined, name) && !hasProp(defining, name)) {
                            throw new Error("No " + name);
                        }
                        return defined[name];
                    }
                    function splitPrefix(name) {
                        var prefix, index = name ? name.indexOf("!") : -1;
                        if (index > -1) {
                            prefix = name.substring(0, index);
                            name = name.substring(index + 1, name.length);
                        }
                        return [ prefix, name ];
                    }
                    function makeRelParts(relName) {
                        return relName ? splitPrefix(relName) : [];
                    }
                    makeMap = function(name, relParts) {
                        var plugin, parts = splitPrefix(name), prefix = parts[0], relResourceName = relParts[1];
                        name = parts[1];
                        if (prefix) {
                            prefix = normalize(prefix, relResourceName);
                            plugin = callDep(prefix);
                        }
                        if (prefix) {
                            if (plugin && plugin.normalize) {
                                name = plugin.normalize(name, makeNormalize(relResourceName));
                            } else {
                                name = normalize(name, relResourceName);
                            }
                        } else {
                            name = normalize(name, relResourceName);
                            parts = splitPrefix(name);
                            prefix = parts[0];
                            name = parts[1];
                            if (prefix) {
                                plugin = callDep(prefix);
                            }
                        }
                        return {
                            f: prefix ? prefix + "!" + name : name,
                            n: name,
                            pr: prefix,
                            p: plugin
                        };
                    };
                    function makeConfig(name) {
                        return function() {
                            return config && config.config && config.config[name] || {};
                        };
                    }
                    handlers = {
                        require: function(name) {
                            return makeRequire(name);
                        },
                        exports: function(name) {
                            var e = defined[name];
                            if (typeof e !== "undefined") {
                                return e;
                            } else {
                                return defined[name] = {};
                            }
                        },
                        module: function(name) {
                            return {
                                id: name,
                                uri: "",
                                exports: defined[name],
                                config: makeConfig(name)
                            };
                        }
                    };
                    main = function(name, deps, callback, relName) {
                        var cjsModule, depName, ret, map, i, relParts, args = [], callbackType = typeof callback, usingExports;
                        relName = relName || name;
                        relParts = makeRelParts(relName);
                        if (callbackType === "undefined" || callbackType === "function") {
                            deps = !deps.length && callback.length ? [ "require", "exports", "module" ] : deps;
                            for (i = 0; i < deps.length; i += 1) {
                                map = makeMap(deps[i], relParts);
                                depName = map.f;
                                if (depName === "require") {
                                    args[i] = handlers.require(name);
                                } else if (depName === "exports") {
                                    args[i] = handlers.exports(name);
                                    usingExports = true;
                                } else if (depName === "module") {
                                    cjsModule = args[i] = handlers.module(name);
                                } else if (hasProp(defined, depName) || hasProp(waiting, depName) || hasProp(defining, depName)) {
                                    args[i] = callDep(depName);
                                } else if (map.p) {
                                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                                    args[i] = defined[depName];
                                } else {
                                    throw new Error(name + " missing " + depName);
                                }
                            }
                            ret = callback ? callback.apply(defined[name], args) : undefined;
                            if (name) {
                                if (cjsModule && cjsModule.exports !== undef && cjsModule.exports !== defined[name]) {
                                    defined[name] = cjsModule.exports;
                                } else if (ret !== undef || !usingExports) {
                                    defined[name] = ret;
                                }
                            }
                        } else if (name) {
                            defined[name] = callback;
                        }
                    };
                    requirejs = require = req = function(deps, callback, relName, forceSync, alt) {
                        if (typeof deps === "string") {
                            if (handlers[deps]) {
                                return handlers[deps](callback);
                            }
                            return callDep(makeMap(deps, makeRelParts(callback)).f);
                        } else if (!deps.splice) {
                            config = deps;
                            if (config.deps) {
                                req(config.deps, config.callback);
                            }
                            if (!callback) {
                                return;
                            }
                            if (callback.splice) {
                                deps = callback;
                                callback = relName;
                                relName = null;
                            } else {
                                deps = undef;
                            }
                        }
                        callback = callback || function() {};
                        if (typeof relName === "function") {
                            relName = forceSync;
                            forceSync = alt;
                        }
                        if (forceSync) {
                            main(undef, deps, callback, relName);
                        } else {
                            setTimeout(function() {
                                main(undef, deps, callback, relName);
                            }, 4);
                        }
                        return req;
                    };
                    req.config = function(cfg) {
                        return req(cfg);
                    };
                    requirejs._defined = defined;
                    define = function(name, deps, callback) {
                        if (typeof name !== "string") {
                            throw new Error("See almond README: incorrect module build, no module name");
                        }
                        if (!deps.splice) {
                            callback = deps;
                            deps = [];
                        }
                        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
                            waiting[name] = [ name, deps, callback ];
                        }
                    };
                    define.amd = {
                        jQuery: true
                    };
                })();
                S2.requirejs = requirejs;
                S2.require = require;
                S2.define = define;
            }
        })();
        S2.define("almond", function() {});
        S2.define("jquery", [], function() {
            var _$ = jQuery || $;
            if (_$ == null && console && console.error) {
                console.error("Select2: An instance of jQuery or a jQuery-compatible library was not " + "found. Make sure that you are including jQuery before Select2 on your " + "web page.");
            }
            return _$;
        });
        S2.define("select2/utils", [ "jquery" ], function($) {
            var Utils = {};
            Utils.Extend = function(ChildClass, SuperClass) {
                var __hasProp = {}.hasOwnProperty;
                function BaseConstructor() {
                    this.constructor = ChildClass;
                }
                for (var key in SuperClass) {
                    if (__hasProp.call(SuperClass, key)) {
                        ChildClass[key] = SuperClass[key];
                    }
                }
                BaseConstructor.prototype = SuperClass.prototype;
                ChildClass.prototype = new BaseConstructor();
                ChildClass.__super__ = SuperClass.prototype;
                return ChildClass;
            };
            function getMethods(theClass) {
                var proto = theClass.prototype;
                var methods = [];
                for (var methodName in proto) {
                    var m = proto[methodName];
                    if (typeof m !== "function") {
                        continue;
                    }
                    if (methodName === "constructor") {
                        continue;
                    }
                    methods.push(methodName);
                }
                return methods;
            }
            Utils.Decorate = function(SuperClass, DecoratorClass) {
                var decoratedMethods = getMethods(DecoratorClass);
                var superMethods = getMethods(SuperClass);
                function DecoratedClass() {
                    var unshift = Array.prototype.unshift;
                    var argCount = DecoratorClass.prototype.constructor.length;
                    var calledConstructor = SuperClass.prototype.constructor;
                    if (argCount > 0) {
                        unshift.call(arguments, SuperClass.prototype.constructor);
                        calledConstructor = DecoratorClass.prototype.constructor;
                    }
                    calledConstructor.apply(this, arguments);
                }
                DecoratorClass.displayName = SuperClass.displayName;
                function ctr() {
                    this.constructor = DecoratedClass;
                }
                DecoratedClass.prototype = new ctr();
                for (var m = 0; m < superMethods.length; m++) {
                    var superMethod = superMethods[m];
                    DecoratedClass.prototype[superMethod] = SuperClass.prototype[superMethod];
                }
                var calledMethod = function(methodName) {
                    var originalMethod = function() {};
                    if (methodName in DecoratedClass.prototype) {
                        originalMethod = DecoratedClass.prototype[methodName];
                    }
                    var decoratedMethod = DecoratorClass.prototype[methodName];
                    return function() {
                        var unshift = Array.prototype.unshift;
                        unshift.call(arguments, originalMethod);
                        return decoratedMethod.apply(this, arguments);
                    };
                };
                for (var d = 0; d < decoratedMethods.length; d++) {
                    var decoratedMethod = decoratedMethods[d];
                    DecoratedClass.prototype[decoratedMethod] = calledMethod(decoratedMethod);
                }
                return DecoratedClass;
            };
            var Observable = function() {
                this.listeners = {};
            };
            Observable.prototype.on = function(event, callback) {
                this.listeners = this.listeners || {};
                if (event in this.listeners) {
                    this.listeners[event].push(callback);
                } else {
                    this.listeners[event] = [ callback ];
                }
            };
            Observable.prototype.trigger = function(event) {
                var slice = Array.prototype.slice;
                var params = slice.call(arguments, 1);
                this.listeners = this.listeners || {};
                if (params == null) {
                    params = [];
                }
                if (params.length === 0) {
                    params.push({});
                }
                params[0]._type = event;
                if (event in this.listeners) {
                    this.invoke(this.listeners[event], slice.call(arguments, 1));
                }
                if ("*" in this.listeners) {
                    this.invoke(this.listeners["*"], arguments);
                }
            };
            Observable.prototype.invoke = function(listeners, params) {
                for (var i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].apply(this, params);
                }
            };
            Utils.Observable = Observable;
            Utils.generateChars = function(length) {
                var chars = "";
                for (var i = 0; i < length; i++) {
                    var randomChar = Math.floor(Math.random() * 36);
                    chars += randomChar.toString(36);
                }
                return chars;
            };
            Utils.bind = function(func, context) {
                return function() {
                    func.apply(context, arguments);
                };
            };
            Utils._convertData = function(data) {
                for (var originalKey in data) {
                    var keys = originalKey.split("-");
                    var dataLevel = data;
                    if (keys.length === 1) {
                        continue;
                    }
                    for (var k = 0; k < keys.length; k++) {
                        var key = keys[k];
                        key = key.substring(0, 1).toLowerCase() + key.substring(1);
                        if (!(key in dataLevel)) {
                            dataLevel[key] = {};
                        }
                        if (k == keys.length - 1) {
                            dataLevel[key] = data[originalKey];
                        }
                        dataLevel = dataLevel[key];
                    }
                    delete data[originalKey];
                }
                return data;
            };
            Utils.hasScroll = function(index, el) {
                var $el = $(el);
                var overflowX = el.style.overflowX;
                var overflowY = el.style.overflowY;
                if (overflowX === overflowY && (overflowY === "hidden" || overflowY === "visible")) {
                    return false;
                }
                if (overflowX === "scroll" || overflowY === "scroll") {
                    return true;
                }
                return $el.innerHeight() < el.scrollHeight || $el.innerWidth() < el.scrollWidth;
            };
            Utils.escapeMarkup = function(markup) {
                var replaceMap = {
                    "\\": "&#92;",
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                    "/": "&#47;"
                };
                if (typeof markup !== "string") {
                    return markup;
                }
                return String(markup).replace(/[&<>"'\/\\]/g, function(match) {
                    return replaceMap[match];
                });
            };
            Utils.__cache = {};
            var id = 0;
            Utils.GetUniqueElementId = function(element) {
                var select2Id = element.getAttribute("data-select2-id");
                if (select2Id != null) {
                    return select2Id;
                }
                if (element.id) {
                    select2Id = "select2-data-" + element.id;
                } else {
                    select2Id = "select2-data-" + (++id).toString() + "-" + Utils.generateChars(4);
                }
                element.setAttribute("data-select2-id", select2Id);
                return select2Id;
            };
            Utils.StoreData = function(element, name, value) {
                var id = Utils.GetUniqueElementId(element);
                if (!Utils.__cache[id]) {
                    Utils.__cache[id] = {};
                }
                Utils.__cache[id][name] = value;
            };
            Utils.GetData = function(element, name) {
                var id = Utils.GetUniqueElementId(element);
                if (name) {
                    if (Utils.__cache[id]) {
                        if (Utils.__cache[id][name] != null) {
                            return Utils.__cache[id][name];
                        }
                        return $(element).data(name);
                    }
                    return $(element).data(name);
                } else {
                    return Utils.__cache[id];
                }
            };
            Utils.RemoveData = function(element) {
                var id = Utils.GetUniqueElementId(element);
                if (Utils.__cache[id] != null) {
                    delete Utils.__cache[id];
                }
                element.removeAttribute("data-select2-id");
            };
            Utils.copyNonInternalCssClasses = function(dest, src) {
                var classes;
                var destinationClasses = dest.getAttribute("class").trim().split(/\s+/);
                destinationClasses = destinationClasses.filter(function(clazz) {
                    return clazz.indexOf("select2-") === 0;
                });
                var sourceClasses = src.getAttribute("class").trim().split(/\s+/);
                sourceClasses = sourceClasses.filter(function(clazz) {
                    return clazz.indexOf("select2-") !== 0;
                });
                var replacements = destinationClasses.concat(sourceClasses);
                dest.setAttribute("class", replacements.join(" "));
            };
            return Utils;
        });
        S2.define("select2/results", [ "jquery", "./utils" ], function($, Utils) {
            function Results($element, options, dataAdapter) {
                this.$element = $element;
                this.data = dataAdapter;
                this.options = options;
                Results.__super__.constructor.call(this);
            }
            Utils.Extend(Results, Utils.Observable);
            Results.prototype.render = function() {
                var $results = $('<ul class="select2-results__options" role="listbox"></ul>');
                if (this.options.get("multiple")) {
                    $results.attr("aria-multiselectable", "true");
                }
                this.$results = $results;
                return $results;
            };
            Results.prototype.clear = function() {
                this.$results.empty();
            };
            Results.prototype.displayMessage = function(params) {
                var escapeMarkup = this.options.get("escapeMarkup");
                this.clear();
                this.hideLoading();
                var $message = $('<li role="alert" aria-live="assertive"' + ' class="select2-results__option"></li>');
                var message = this.options.get("translations").get(params.message);
                $message.append(escapeMarkup(message(params.args)));
                $message[0].className += " select2-results__message";
                this.$results.append($message);
            };
            Results.prototype.hideMessages = function() {
                this.$results.find(".select2-results__message").remove();
            };
            Results.prototype.append = function(data) {
                this.hideLoading();
                var $options = [];
                if (data.results == null || data.results.length === 0) {
                    if (this.$results.children().length === 0) {
                        this.trigger("results:message", {
                            message: "noResults"
                        });
                    }
                    return;
                }
                data.results = this.sort(data.results);
                for (var d = 0; d < data.results.length; d++) {
                    var item = data.results[d];
                    var $option = this.option(item);
                    $options.push($option);
                }
                this.$results.append($options);
            };
            Results.prototype.position = function($results, $dropdown) {
                var $resultsContainer = $dropdown.find(".select2-results");
                $resultsContainer.append($results);
            };
            Results.prototype.sort = function(data) {
                var sorter = this.options.get("sorter");
                return sorter(data);
            };
            Results.prototype.highlightFirstItem = function() {
                var $options = this.$results.find(".select2-results__option--selectable");
                var $selected = $options.filter(".select2-results__option--selected");
                if ($selected.length > 0) {
                    $selected.first().trigger("mouseenter");
                } else {
                    $options.first().trigger("mouseenter");
                }
                this.ensureHighlightVisible();
            };
            Results.prototype.setClasses = function() {
                var self = this;
                this.data.current(function(selected) {
                    var selectedIds = selected.map(function(s) {
                        return s.id.toString();
                    });
                    var $options = self.$results.find(".select2-results__option--selectable");
                    $options.each(function() {
                        var $option = $(this);
                        var item = Utils.GetData(this, "data");
                        var id = "" + item.id;
                        if (item.element != null && item.element.selected || item.element == null && selectedIds.indexOf(id) > -1) {
                            this.classList.add("select2-results__option--selected");
                            $option.attr("aria-selected", "true");
                        } else {
                            this.classList.remove("select2-results__option--selected");
                            $option.attr("aria-selected", "false");
                        }
                    });
                });
            };
            Results.prototype.showLoading = function(params) {
                this.hideLoading();
                var loadingMore = this.options.get("translations").get("searching");
                var loading = {
                    disabled: true,
                    loading: true,
                    text: loadingMore(params)
                };
                var $loading = this.option(loading);
                $loading.className += " loading-results";
                this.$results.prepend($loading);
            };
            Results.prototype.hideLoading = function() {
                this.$results.find(".loading-results").remove();
            };
            Results.prototype.option = function(data) {
                var option = document.createElement("li");
                option.classList.add("select2-results__option");
                option.classList.add("select2-results__option--selectable");
                var attrs = {
                    role: "option"
                };
                var matches = window.Element.prototype.matches || window.Element.prototype.msMatchesSelector || window.Element.prototype.webkitMatchesSelector;
                if (data.element != null && matches.call(data.element, ":disabled") || data.element == null && data.disabled) {
                    attrs["aria-disabled"] = "true";
                    option.classList.remove("select2-results__option--selectable");
                    option.classList.add("select2-results__option--disabled");
                }
                if (data.id == null) {
                    option.classList.remove("select2-results__option--selectable");
                }
                if (data._resultId != null) {
                    option.id = data._resultId;
                }
                if (data.title) {
                    option.title = data.title;
                }
                if (data.children) {
                    attrs.role = "group";
                    attrs["aria-label"] = data.text;
                    option.classList.remove("select2-results__option--selectable");
                    option.classList.add("select2-results__option--group");
                }
                for (var attr in attrs) {
                    var val = attrs[attr];
                    option.setAttribute(attr, val);
                }
                if (data.children) {
                    var $option = $(option);
                    var label = document.createElement("strong");
                    label.className = "select2-results__group";
                    this.template(data, label);
                    var $children = [];
                    for (var c = 0; c < data.children.length; c++) {
                        var child = data.children[c];
                        var $child = this.option(child);
                        $children.push($child);
                    }
                    var $childrenContainer = $("<ul></ul>", {
                        class: "select2-results__options select2-results__options--nested",
                        role: "none"
                    });
                    $childrenContainer.append($children);
                    $option.append(label);
                    $option.append($childrenContainer);
                } else {
                    this.template(data, option);
                }
                Utils.StoreData(option, "data", data);
                return option;
            };
            Results.prototype.bind = function(container, $container) {
                var self = this;
                var id = container.id + "-results";
                this.$results.attr("id", id);
                container.on("results:all", function(params) {
                    self.clear();
                    self.append(params.data);
                    if (container.isOpen()) {
                        self.setClasses();
                        self.highlightFirstItem();
                    }
                });
                container.on("results:append", function(params) {
                    self.append(params.data);
                    if (container.isOpen()) {
                        self.setClasses();
                    }
                });
                container.on("query", function(params) {
                    self.hideMessages();
                    self.showLoading(params);
                });
                container.on("select", function() {
                    if (!container.isOpen()) {
                        return;
                    }
                    self.setClasses();
                    if (self.options.get("scrollAfterSelect")) {
                        self.highlightFirstItem();
                    }
                });
                container.on("unselect", function() {
                    if (!container.isOpen()) {
                        return;
                    }
                    self.setClasses();
                    if (self.options.get("scrollAfterSelect")) {
                        self.highlightFirstItem();
                    }
                });
                container.on("open", function() {
                    self.$results.attr("aria-expanded", "true");
                    self.$results.attr("aria-hidden", "false");
                    self.setClasses();
                    self.ensureHighlightVisible();
                });
                container.on("close", function() {
                    self.$results.attr("aria-expanded", "false");
                    self.$results.attr("aria-hidden", "true");
                    self.$results.removeAttr("aria-activedescendant");
                });
                container.on("results:toggle", function() {
                    var $highlighted = self.getHighlightedResults();
                    if ($highlighted.length === 0) {
                        return;
                    }
                    $highlighted.trigger("mouseup");
                });
                container.on("results:select", function() {
                    var $highlighted = self.getHighlightedResults();
                    if ($highlighted.length === 0) {
                        return;
                    }
                    var data = Utils.GetData($highlighted[0], "data");
                    if ($highlighted.hasClass("select2-results__option--selected")) {
                        self.trigger("close", {});
                    } else {
                        self.trigger("select", {
                            data: data
                        });
                    }
                });
                container.on("results:previous", function() {
                    var $highlighted = self.getHighlightedResults();
                    var $options = self.$results.find(".select2-results__option--selectable");
                    var currentIndex = $options.index($highlighted);
                    if (currentIndex <= 0) {
                        return;
                    }
                    var nextIndex = currentIndex - 1;
                    if ($highlighted.length === 0) {
                        nextIndex = 0;
                    }
                    var $next = $options.eq(nextIndex);
                    $next.trigger("mouseenter");
                    var currentOffset = self.$results.offset().top;
                    var nextTop = $next.offset().top;
                    var nextOffset = self.$results.scrollTop() + (nextTop - currentOffset);
                    if (nextIndex === 0) {
                        self.$results.scrollTop(0);
                    } else if (nextTop - currentOffset < 0) {
                        self.$results.scrollTop(nextOffset);
                    }
                });
                container.on("results:next", function() {
                    var $highlighted = self.getHighlightedResults();
                    var $options = self.$results.find(".select2-results__option--selectable");
                    var currentIndex = $options.index($highlighted);
                    var nextIndex = currentIndex + 1;
                    if (nextIndex >= $options.length) {
                        return;
                    }
                    var $next = $options.eq(nextIndex);
                    $next.trigger("mouseenter");
                    var currentOffset = self.$results.offset().top + self.$results.outerHeight(false);
                    var nextBottom = $next.offset().top + $next.outerHeight(false);
                    var nextOffset = self.$results.scrollTop() + nextBottom - currentOffset;
                    if (nextIndex === 0) {
                        self.$results.scrollTop(0);
                    } else if (nextBottom > currentOffset) {
                        self.$results.scrollTop(nextOffset);
                    }
                });
                container.on("results:focus", function(params) {
                    params.element[0].classList.add("select2-results__option--highlighted");
                    params.element[0].setAttribute("aria-selected", "true");
                });
                container.on("results:message", function(params) {
                    self.displayMessage(params);
                });
                if ($.fn.mousewheel) {
                    this.$results.on("mousewheel", function(e) {
                        var top = self.$results.scrollTop();
                        var bottom = self.$results.get(0).scrollHeight - top + e.deltaY;
                        var isAtTop = e.deltaY > 0 && top - e.deltaY <= 0;
                        var isAtBottom = e.deltaY < 0 && bottom <= self.$results.height();
                        if (isAtTop) {
                            self.$results.scrollTop(0);
                            e.preventDefault();
                            e.stopPropagation();
                        } else if (isAtBottom) {
                            self.$results.scrollTop(self.$results.get(0).scrollHeight - self.$results.height());
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    });
                }
                this.$results.on("mouseup", ".select2-results__option--selectable", function(evt) {
                    var $this = $(this);
                    var data = Utils.GetData(this, "data");
                    if ($this.hasClass("select2-results__option--selected")) {
                        if (self.options.get("multiple")) {
                            self.trigger("unselect", {
                                originalEvent: evt,
                                data: data
                            });
                        } else {
                            self.trigger("close", {});
                        }
                        return;
                    }
                    self.trigger("select", {
                        originalEvent: evt,
                        data: data
                    });
                });
                this.$results.on("mouseenter", ".select2-results__option--selectable", function(evt) {
                    var data = Utils.GetData(this, "data");
                    self.getHighlightedResults().removeClass("select2-results__option--highlighted").attr("aria-selected", "false");
                    self.trigger("results:focus", {
                        data: data,
                        element: $(this)
                    });
                });
            };
            Results.prototype.getHighlightedResults = function() {
                var $highlighted = this.$results.find(".select2-results__option--highlighted");
                return $highlighted;
            };
            Results.prototype.destroy = function() {
                this.$results.remove();
            };
            Results.prototype.ensureHighlightVisible = function() {
                var $highlighted = this.getHighlightedResults();
                if ($highlighted.length === 0) {
                    return;
                }
                var $options = this.$results.find(".select2-results__option--selectable");
                var currentIndex = $options.index($highlighted);
                var currentOffset = this.$results.offset().top;
                var nextTop = $highlighted.offset().top;
                var nextOffset = this.$results.scrollTop() + (nextTop - currentOffset);
                var offsetDelta = nextTop - currentOffset;
                nextOffset -= $highlighted.outerHeight(false) * 2;
                if (currentIndex <= 2) {
                    this.$results.scrollTop(0);
                } else if (offsetDelta > this.$results.outerHeight() || offsetDelta < 0) {
                    this.$results.scrollTop(nextOffset);
                }
            };
            Results.prototype.template = function(result, container) {
                var template = this.options.get("templateResult");
                var escapeMarkup = this.options.get("escapeMarkup");
                var content = template(result, container);
                if (content == null) {
                    container.style.display = "none";
                } else if (typeof content === "string") {
                    container.innerHTML = escapeMarkup(content);
                } else {
                    $(container).append(content);
                }
            };
            return Results;
        });
        S2.define("select2/keys", [], function() {
            var KEYS = {
                BACKSPACE: 8,
                TAB: 9,
                ENTER: 13,
                SHIFT: 16,
                CTRL: 17,
                ALT: 18,
                ESC: 27,
                SPACE: 32,
                PAGE_UP: 33,
                PAGE_DOWN: 34,
                END: 35,
                HOME: 36,
                LEFT: 37,
                UP: 38,
                RIGHT: 39,
                DOWN: 40,
                DELETE: 46
            };
            return KEYS;
        });
        S2.define("select2/selection/base", [ "jquery", "../utils", "../keys" ], function($, Utils, KEYS) {
            function BaseSelection($element, options) {
                this.$element = $element;
                this.options = options;
                BaseSelection.__super__.constructor.call(this);
            }
            Utils.Extend(BaseSelection, Utils.Observable);
            BaseSelection.prototype.render = function() {
                var $selection = $('<span class="select2-selection" role="combobox" ' + ' aria-haspopup="true" aria-expanded="false">' + "</span>");
                this._tabindex = 0;
                if (Utils.GetData(this.$element[0], "old-tabindex") != null) {
                    this._tabindex = Utils.GetData(this.$element[0], "old-tabindex");
                } else if (this.$element.attr("tabindex") != null) {
                    this._tabindex = this.$element.attr("tabindex");
                }
                $selection.attr("title", this.$element.attr("title"));
                $selection.attr("tabindex", this._tabindex);
                $selection.attr("aria-disabled", "false");
                this.$selection = $selection;
                return $selection;
            };
            BaseSelection.prototype.bind = function(container, $container) {
                var self = this;
                var resultsId = container.id + "-results";
                this.container = container;
                this.$selection.on("focus", function(evt) {
                    self.trigger("focus", evt);
                });
                this.$selection.on("blur", function(evt) {
                    self._handleBlur(evt);
                });
                this.$selection.on("keydown", function(evt) {
                    self.trigger("keypress", evt);
                    if (evt.which === KEYS.SPACE) {
                        evt.preventDefault();
                    }
                });
                container.on("results:focus", function(params) {
                    self.$selection.attr("aria-activedescendant", params.data._resultId);
                });
                container.on("selection:update", function(params) {
                    self.update(params.data);
                });
                container.on("open", function() {
                    self.$selection.attr("aria-expanded", "true");
                    self.$selection.attr("aria-owns", resultsId);
                    self._attachCloseHandler(container);
                });
                container.on("close", function() {
                    self.$selection.attr("aria-expanded", "false");
                    self.$selection.removeAttr("aria-activedescendant");
                    self.$selection.removeAttr("aria-owns");
                    self.$selection.trigger("focus");
                    self._detachCloseHandler(container);
                });
                container.on("enable", function() {
                    self.$selection.attr("tabindex", self._tabindex);
                    self.$selection.attr("aria-disabled", "false");
                });
                container.on("disable", function() {
                    self.$selection.attr("tabindex", "-1");
                    self.$selection.attr("aria-disabled", "true");
                });
            };
            BaseSelection.prototype._handleBlur = function(evt) {
                var self = this;
                window.setTimeout(function() {
                    if (document.activeElement == self.$selection[0] || $.contains(self.$selection[0], document.activeElement)) {
                        return;
                    }
                    self.trigger("blur", evt);
                }, 1);
            };
            BaseSelection.prototype._attachCloseHandler = function(container) {
                $(document.body).on("mousedown.select2." + container.id, function(e) {
                    var $target = $(e.target);
                    var $select = $target.closest(".select2");
                    var $all = $(".select2.select2-container--open");
                    $all.each(function() {
                        if (this == $select[0]) {
                            return;
                        }
                        var $element = Utils.GetData(this, "element");
                        $element.select2("close");
                    });
                });
            };
            BaseSelection.prototype._detachCloseHandler = function(container) {
                $(document.body).off("mousedown.select2." + container.id);
            };
            BaseSelection.prototype.position = function($selection, $container) {
                var $selectionContainer = $container.find(".selection");
                $selectionContainer.append($selection);
            };
            BaseSelection.prototype.destroy = function() {
                this._detachCloseHandler(this.container);
            };
            BaseSelection.prototype.update = function(data) {
                throw new Error("The `update` method must be defined in child classes.");
            };
            BaseSelection.prototype.isEnabled = function() {
                return !this.isDisabled();
            };
            BaseSelection.prototype.isDisabled = function() {
                return this.options.get("disabled");
            };
            return BaseSelection;
        });
        S2.define("select2/selection/single", [ "jquery", "./base", "../utils", "../keys" ], function($, BaseSelection, Utils, KEYS) {
            function SingleSelection() {
                SingleSelection.__super__.constructor.apply(this, arguments);
            }
            Utils.Extend(SingleSelection, BaseSelection);
            SingleSelection.prototype.render = function() {
                var $selection = SingleSelection.__super__.render.call(this);
                $selection[0].classList.add("select2-selection--single");
                $selection.html('<span class="select2-selection__rendered"></span>' + '<span class="select2-selection__arrow" role="presentation">' + '<b role="presentation"></b>' + "</span>");
                return $selection;
            };
            SingleSelection.prototype.bind = function(container, $container) {
                var self = this;
                SingleSelection.__super__.bind.apply(this, arguments);
                var id = container.id + "-container";
                this.$selection.find(".select2-selection__rendered").attr("id", id).attr("role", "textbox").attr("aria-readonly", "true");
                this.$selection.attr("aria-labelledby", id);
                this.$selection.attr("aria-controls", id);
                this.$selection.on("mousedown", function(evt) {
                    if (evt.which !== 1) {
                        return;
                    }
                    self.trigger("toggle", {
                        originalEvent: evt
                    });
                });
                this.$selection.on("focus", function(evt) {});
                this.$selection.on("blur", function(evt) {});
                container.on("focus", function(evt) {
                    if (!container.isOpen()) {
                        self.$selection.trigger("focus");
                    }
                });
            };
            SingleSelection.prototype.clear = function() {
                var $rendered = this.$selection.find(".select2-selection__rendered");
                $rendered.empty();
                $rendered.removeAttr("title");
            };
            SingleSelection.prototype.display = function(data, container) {
                var template = this.options.get("templateSelection");
                var escapeMarkup = this.options.get("escapeMarkup");
                return escapeMarkup(template(data, container));
            };
            SingleSelection.prototype.selectionContainer = function() {
                return $("<span></span>");
            };
            SingleSelection.prototype.update = function(data) {
                if (data.length === 0) {
                    this.clear();
                    return;
                }
                var selection = data[0];
                var $rendered = this.$selection.find(".select2-selection__rendered");
                var formatted = this.display(selection, $rendered);
                $rendered.empty().append(formatted);
                var title = selection.title || selection.text;
                if (title) {
                    $rendered.attr("title", title);
                } else {
                    $rendered.removeAttr("title");
                }
            };
            return SingleSelection;
        });
        S2.define("select2/selection/multiple", [ "jquery", "./base", "../utils" ], function($, BaseSelection, Utils) {
            function MultipleSelection($element, options) {
                MultipleSelection.__super__.constructor.apply(this, arguments);
            }
            Utils.Extend(MultipleSelection, BaseSelection);
            MultipleSelection.prototype.render = function() {
                var $selection = MultipleSelection.__super__.render.call(this);
                $selection[0].classList.add("select2-selection--multiple");
                $selection.html('<ul class="select2-selection__rendered"></ul>');
                return $selection;
            };
            MultipleSelection.prototype.bind = function(container, $container) {
                var self = this;
                MultipleSelection.__super__.bind.apply(this, arguments);
                var id = container.id + "-container";
                this.$selection.find(".select2-selection__rendered").attr("id", id);
                this.$selection.on("click", function(evt) {
                    self.trigger("toggle", {
                        originalEvent: evt
                    });
                });
                this.$selection.on("click", ".select2-selection__choice__remove", function(evt) {
                    if (self.isDisabled()) {
                        return;
                    }
                    var $remove = $(this);
                    var $selection = $remove.parent().parent();
                    var data = Utils.GetData($selection[0], "data");
                    self.trigger("unselect", {
                        originalEvent: evt,
                        data: data
                    });
                });
                this.$selection.on("keydown", ".select2-selection__choice__remove", function(evt) {
                    if (self.isDisabled()) {
                        return;
                    }
                    evt.stopPropagation();
                });
            };
            MultipleSelection.prototype.clear = function() {
                var $rendered = this.$selection.find(".select2-selection__rendered");
                $rendered.empty();
                $rendered.removeAttr("title");
            };
            MultipleSelection.prototype.display = function(data, container) {
                var template = this.options.get("templateSelection");
                var escapeMarkup = this.options.get("escapeMarkup");
                return escapeMarkup(template(data, container));
            };
            MultipleSelection.prototype.selectionContainer = function() {
                var $container = $('<li class="select2-selection__choice">' + '<span class="badge bg-primary">' + '<i class="fas fa-tag me-1"></i>' + '<span class="select2-selection__choice__display"></span>' + '<button type="button" class="btn-close btn-close-white btn-sm select2-selection__choice__remove" ' + 'tabindex="-1">' + "</button>" + "</span>" + "</li>");
                return $container;
            };
            MultipleSelection.prototype.update = function(data) {
                this.clear();
                if (data.length === 0) {
                    return;
                }
                var $selections = [];
                var selectionIdPrefix = this.$selection.find(".select2-selection__rendered").attr("id") + "-choice-";
                for (var d = 0; d < data.length; d++) {
                    var selection = data[d];
                    var $selection = this.selectionContainer();
                    var formatted = this.display(selection, $selection);
                    var selectionId = selectionIdPrefix + Utils.generateChars(4) + "-";
                    if (selection.id) {
                        selectionId += selection.id;
                    } else {
                        selectionId += Utils.generateChars(4);
                    }
                    $selection.find(".select2-selection__choice__display").append(formatted).attr("id", selectionId);
                    var title = selection.title || selection.text;
                    if (title) {
                        $selection.attr("title", title);
                    }
                    var removeItem = this.options.get("translations").get("removeItem");
                    var $remove = $selection.find(".select2-selection__choice__remove");
                    $remove.attr("title", removeItem());
                    $remove.attr("aria-label", removeItem());
                    $remove.attr("aria-describedby", selectionId);
                    Utils.StoreData($selection[0], "data", selection);
                    $selections.push($selection);
                }
                var $rendered = this.$selection.find(".select2-selection__rendered");
                $rendered.append($selections);
            };
            return MultipleSelection;
        });
        S2.define("select2/selection/placeholder", [], function() {
            function Placeholder(decorated, $element, options) {
                this.placeholder = this.normalizePlaceholder(options.get("placeholder"));
                decorated.call(this, $element, options);
            }
            Placeholder.prototype.normalizePlaceholder = function(_, placeholder) {
                if (typeof placeholder === "string") {
                    placeholder = {
                        id: "",
                        text: placeholder
                    };
                }
                return placeholder;
            };
            Placeholder.prototype.createPlaceholder = function(decorated, placeholder) {
                var $placeholder = this.selectionContainer();
                $placeholder.html(this.display(placeholder));
                $placeholder[0].classList.add("select2-selection__placeholder");
                $placeholder[0].classList.remove("select2-selection__choice");
                var placeholderTitle = placeholder.title || placeholder.text || $placeholder.text();
                this.$selection.find(".select2-selection__rendered").attr("title", placeholderTitle);
                return $placeholder;
            };
            Placeholder.prototype.update = function(decorated, data) {
                var singlePlaceholder = data.length == 1 && data[0].id != this.placeholder.id;
                var multipleSelections = data.length > 1;
                if (multipleSelections || singlePlaceholder) {
                    return decorated.call(this, data);
                }
                this.clear();
                var $placeholder = this.createPlaceholder(this.placeholder);
                this.$selection.find(".select2-selection__rendered").append($placeholder);
            };
            return Placeholder;
        });
        S2.define("select2/selection/allowClear", [ "jquery", "../keys", "../utils" ], function($, KEYS, Utils) {
            function AllowClear() {}
            AllowClear.prototype.bind = function(decorated, container, $container) {
                var self = this;
                decorated.call(this, container, $container);
                if (this.placeholder == null) {
                    if (this.options.get("debug") && window.console && console.error) {
                        console.error("Select2: The `allowClear` option should be used in combination " + "with the `placeholder` option.");
                    }
                }
                this.$selection.on("mousedown", ".select2-selection__clear", function(evt) {
                    self._handleClear(evt);
                });
                container.on("keypress", function(evt) {
                    self._handleKeyboardClear(evt, container);
                });
            };
            AllowClear.prototype._handleClear = function(_, evt) {
                if (this.isDisabled()) {
                    return;
                }
                var $clear = this.$selection.find(".select2-selection__clear");
                if ($clear.length === 0) {
                    return;
                }
                evt.stopPropagation();
                var data = Utils.GetData($clear[0], "data");
                var previousVal = this.$element.val();
                this.$element.val(this.placeholder.id);
                var unselectData = {
                    data: data
                };
                this.trigger("clear", unselectData);
                if (unselectData.prevented) {
                    this.$element.val(previousVal);
                    return;
                }
                for (var d = 0; d < data.length; d++) {
                    unselectData = {
                        data: data[d]
                    };
                    this.trigger("unselect", unselectData);
                    if (unselectData.prevented) {
                        this.$element.val(previousVal);
                        return;
                    }
                }
                this.$element.trigger("input").trigger("change");
                this.trigger("toggle", {});
            };
            AllowClear.prototype._handleKeyboardClear = function(_, evt, container) {
                if (container.isOpen()) {
                    return;
                }
                if (evt.which == KEYS.DELETE || evt.which == KEYS.BACKSPACE) {
                    this._handleClear(evt);
                }
            };
            AllowClear.prototype.update = function(decorated, data) {
                decorated.call(this, data);
                this.$selection.find(".select2-selection__clear").remove();
                this.$selection[0].classList.remove("select2-selection--clearable");
                if (this.$selection.find(".select2-selection__placeholder").length > 0 || data.length === 0) {
                    return;
                }
                var selectionId = this.$selection.find(".select2-selection__rendered").attr("id");
                var removeAll = this.options.get("translations").get("removeAllItems");
                var $remove = $('<button type="button" class="select2-selection__clear" tabindex="-1">' + '<span aria-hidden="true">&times;</span>' + "</button>");
                $remove.attr("title", removeAll());
                $remove.attr("aria-label", removeAll());
                $remove.attr("aria-describedby", selectionId);
                Utils.StoreData($remove[0], "data", data);
                this.$selection.prepend($remove);
                this.$selection[0].classList.add("select2-selection--clearable");
            };
            return AllowClear;
        });
        S2.define("select2/selection/search", [ "jquery", "../utils", "../keys" ], function($, Utils, KEYS) {
            function Search(decorated, $element, options) {
                decorated.call(this, $element, options);
            }
            Search.prototype.render = function(decorated) {
                var searchLabel = this.options.get("translations").get("search");
                var $search = $('<span class="select2-search select2-search--inline">' + '<input class="select2-search__field"' + ' type="search" tabindex="-1"' + ' placeholder="search..."' + ' aria-autocomplete="list" >' + "</input>" + "</span>");
                this.$searchContainer = $search;
                this.$search = $search.find("input");
                this.$search.prop("autocomplete", this.options.get("autocomplete"));
                this.$search.attr("aria-label", searchLabel());
                var $rendered = decorated.call(this);
                this._transferTabIndex();
                $rendered.append(this.$searchContainer);
                return $rendered;
            };
            Search.prototype.bind = function(decorated, container, $container) {
                var self = this;
                var resultsId = container.id + "-results";
                var selectionId = container.id + "-container";
                decorated.call(this, container, $container);
                self.$search.attr("aria-describedby", selectionId);
                container.on("open", function() {
                    self.$search.attr("aria-controls", resultsId);
                    self.$search.trigger("focus");
                });
                container.on("close", function() {
                    self.$search.val("");
                    self.resizeSearch();
                    self.$search.removeAttr("aria-controls");
                    self.$search.removeAttr("aria-activedescendant");
                    self.$search.trigger("focus");
                });
                container.on("enable", function() {
                    self.$search.prop("disabled", false);
                    self._transferTabIndex();
                });
                container.on("disable", function() {
                    self.$search.prop("disabled", true);
                });
                container.on("focus", function(evt) {
                    self.$search.trigger("focus");
                });
                container.on("results:focus", function(params) {
                    if (params.data._resultId) {
                        self.$search.attr("aria-activedescendant", params.data._resultId);
                    } else {
                        self.$search.removeAttr("aria-activedescendant");
                    }
                });
                this.$selection.on("focusin", ".select2-search--inline", function(evt) {
                    self.trigger("focus", evt);
                });
                this.$selection.on("focusout", ".select2-search--inline", function(evt) {
                    self._handleBlur(evt);
                });
                this.$selection.on("keydown", ".select2-search--inline", function(evt) {
                    evt.stopPropagation();
                    self.trigger("keypress", evt);
                    self._keyUpPrevented = evt.isDefaultPrevented();
                    var key = evt.which;
                    if (key === KEYS.BACKSPACE && self.$search.val() === "") {
                        var $previousChoice = self.$selection.find(".select2-selection__choice").last();
                        if ($previousChoice.length > 0) {
                            var item = Utils.GetData($previousChoice[0], "data");
                            self.searchRemoveChoice(item);
                            evt.preventDefault();
                        }
                    }
                });
                this.$selection.on("click", ".select2-search--inline", function(evt) {
                    if (self.$search.val()) {
                        evt.stopPropagation();
                    }
                });
                var msie = document.documentMode;
                var disableInputEvents = msie && msie <= 11;
                this.$selection.on("input.searchcheck", ".select2-search--inline", function(evt) {
                    if (disableInputEvents) {
                        self.$selection.off("input.search input.searchcheck");
                        return;
                    }
                    self.$selection.off("keyup.search");
                });
                this.$selection.on("keyup.search input.search", ".select2-search--inline", function(evt) {
                    if (disableInputEvents && evt.type === "input") {
                        self.$selection.off("input.search input.searchcheck");
                        return;
                    }
                    var key = evt.which;
                    if (key == KEYS.SHIFT || key == KEYS.CTRL || key == KEYS.ALT) {
                        return;
                    }
                    if (key == KEYS.TAB) {
                        return;
                    }
                    self.handleSearch(evt);
                });
            };
            Search.prototype._transferTabIndex = function(decorated) {
                this.$search.attr("tabindex", this.$selection.attr("tabindex"));
                this.$selection.attr("tabindex", "-1");
            };
            Search.prototype.createPlaceholder = function(decorated, placeholder) {
                this.$search.attr("placeholder", placeholder.text);
            };
            Search.prototype.update = function(decorated, data) {
                var searchHadFocus = this.$search[0] == document.activeElement;
                this.$search.attr("placeholder", "");
                decorated.call(this, data);
                this.resizeSearch();
                if (searchHadFocus) {
                    this.$search.trigger("focus");
                }
            };
            Search.prototype.handleSearch = function() {
                this.resizeSearch();
                if (!this._keyUpPrevented) {
                    var input = this.$search.val();
                    this.trigger("query", {
                        term: input
                    });
                }
                this._keyUpPrevented = false;
            };
            Search.prototype.searchRemoveChoice = function(decorated, item) {
                this.trigger("unselect", {
                    data: item
                });
                this.$search.val(item.text);
                this.handleSearch();
            };
            Search.prototype.resizeSearch = function() {
                this.$search.css("width", "25px");
                var width = "100%";
                if (this.$search.attr("placeholder") === "") {
                    var minimumWidth = this.$search.val().length + 1;
                    width = minimumWidth * .75 + "em";
                }
                this.$search.css("width", width);
            };
            return Search;
        });
        S2.define("select2/selection/selectionCss", [ "../utils" ], function(Utils) {
            function SelectionCSS() {}
            SelectionCSS.prototype.render = function(decorated) {
                var $selection = decorated.call(this);
                var selectionCssClass = this.options.get("selectionCssClass") || "";
                if (selectionCssClass.indexOf(":all:") !== -1) {
                    selectionCssClass = selectionCssClass.replace(":all:", "");
                    Utils.copyNonInternalCssClasses($selection[0], this.$element[0]);
                }
                $selection.addClass(selectionCssClass);
                return $selection;
            };
            return SelectionCSS;
        });
        S2.define("select2/selection/eventRelay", [ "jquery" ], function($) {
            function EventRelay() {}
            EventRelay.prototype.bind = function(decorated, container, $container) {
                var self = this;
                var relayEvents = [ "open", "opening", "close", "closing", "select", "selecting", "unselect", "unselecting", "clear", "clearing" ];
                var preventableEvents = [ "opening", "closing", "selecting", "unselecting", "clearing" ];
                decorated.call(this, container, $container);
                container.on("*", function(name, params) {
                    if (relayEvents.indexOf(name) === -1) {
                        return;
                    }
                    params = params || {};
                    var evt = $.Event("select2:" + name, {
                        params: params
                    });
                    self.$element.trigger(evt);
                    if (preventableEvents.indexOf(name) === -1) {
                        return;
                    }
                    params.prevented = evt.isDefaultPrevented();
                });
            };
            return EventRelay;
        });
        S2.define("select2/translation", [ "jquery", "require" ], function($, require) {
            function Translation(dict) {
                this.dict = dict || {};
            }
            Translation.prototype.all = function() {
                return this.dict;
            };
            Translation.prototype.get = function(key) {
                return this.dict[key];
            };
            Translation.prototype.extend = function(translation) {
                this.dict = $.extend({}, translation.all(), this.dict);
            };
            Translation._cache = {};
            Translation.loadPath = function(path) {
                if (!(path in Translation._cache)) {
                    var translations = require(path);
                    Translation._cache[path] = translations;
                }
                return new Translation(Translation._cache[path]);
            };
            return Translation;
        });
        S2.define("select2/diacritics", [], function() {
            var diacritics = {
                "Ⓐ": "A",
                "Ａ": "A",
                "À": "A",
                "Á": "A",
                "Â": "A",
                "Ầ": "A",
                "Ấ": "A",
                "Ẫ": "A",
                "Ẩ": "A",
                "Ã": "A",
                "Ā": "A",
                "Ă": "A",
                "Ằ": "A",
                "Ắ": "A",
                "Ẵ": "A",
                "Ẳ": "A",
                "Ȧ": "A",
                "Ǡ": "A",
                "Ä": "A",
                "Ǟ": "A",
                "Ả": "A",
                "Å": "A",
                "Ǻ": "A",
                "Ǎ": "A",
                "Ȁ": "A",
                "Ȃ": "A",
                "Ạ": "A",
                "Ậ": "A",
                "Ặ": "A",
                "Ḁ": "A",
                "Ą": "A",
                "Ⱥ": "A",
                "Ɐ": "A",
                "Ꜳ": "AA",
                "Æ": "AE",
                "Ǽ": "AE",
                "Ǣ": "AE",
                "Ꜵ": "AO",
                "Ꜷ": "AU",
                "Ꜹ": "AV",
                "Ꜻ": "AV",
                "Ꜽ": "AY",
                "Ⓑ": "B",
                "Ｂ": "B",
                "Ḃ": "B",
                "Ḅ": "B",
                "Ḇ": "B",
                "Ƀ": "B",
                "Ƃ": "B",
                "Ɓ": "B",
                "Ⓒ": "C",
                "Ｃ": "C",
                "Ć": "C",
                "Ĉ": "C",
                "Ċ": "C",
                "Č": "C",
                "Ç": "C",
                "Ḉ": "C",
                "Ƈ": "C",
                "Ȼ": "C",
                "Ꜿ": "C",
                "Ⓓ": "D",
                "Ｄ": "D",
                "Ḋ": "D",
                "Ď": "D",
                "Ḍ": "D",
                "Ḑ": "D",
                "Ḓ": "D",
                "Ḏ": "D",
                "Đ": "D",
                "Ƌ": "D",
                "Ɗ": "D",
                "Ɖ": "D",
                "Ꝺ": "D",
                "Ǳ": "DZ",
                "Ǆ": "DZ",
                "ǲ": "Dz",
                "ǅ": "Dz",
                "Ⓔ": "E",
                "Ｅ": "E",
                "È": "E",
                "É": "E",
                "Ê": "E",
                "Ề": "E",
                "Ế": "E",
                "Ễ": "E",
                "Ể": "E",
                "Ẽ": "E",
                "Ē": "E",
                "Ḕ": "E",
                "Ḗ": "E",
                "Ĕ": "E",
                "Ė": "E",
                "Ë": "E",
                "Ẻ": "E",
                "Ě": "E",
                "Ȅ": "E",
                "Ȇ": "E",
                "Ẹ": "E",
                "Ệ": "E",
                "Ȩ": "E",
                "Ḝ": "E",
                "Ę": "E",
                "Ḙ": "E",
                "Ḛ": "E",
                "Ɛ": "E",
                "Ǝ": "E",
                "Ⓕ": "F",
                "Ｆ": "F",
                "Ḟ": "F",
                "Ƒ": "F",
                "Ꝼ": "F",
                "Ⓖ": "G",
                "Ｇ": "G",
                "Ǵ": "G",
                "Ĝ": "G",
                "Ḡ": "G",
                "Ğ": "G",
                "Ġ": "G",
                "Ǧ": "G",
                "Ģ": "G",
                "Ǥ": "G",
                "Ɠ": "G",
                "Ꞡ": "G",
                "Ᵹ": "G",
                "Ꝿ": "G",
                "Ⓗ": "H",
                "Ｈ": "H",
                "Ĥ": "H",
                "Ḣ": "H",
                "Ḧ": "H",
                "Ȟ": "H",
                "Ḥ": "H",
                "Ḩ": "H",
                "Ḫ": "H",
                "Ħ": "H",
                "Ⱨ": "H",
                "Ⱶ": "H",
                "Ɥ": "H",
                "Ⓘ": "I",
                "Ｉ": "I",
                "Ì": "I",
                "Í": "I",
                "Î": "I",
                "Ĩ": "I",
                "Ī": "I",
                "Ĭ": "I",
                "İ": "I",
                "Ï": "I",
                "Ḯ": "I",
                "Ỉ": "I",
                "Ǐ": "I",
                "Ȉ": "I",
                "Ȋ": "I",
                "Ị": "I",
                "Į": "I",
                "Ḭ": "I",
                "Ɨ": "I",
                "Ⓙ": "J",
                "Ｊ": "J",
                "Ĵ": "J",
                "Ɉ": "J",
                "Ⓚ": "K",
                "Ｋ": "K",
                "Ḱ": "K",
                "Ǩ": "K",
                "Ḳ": "K",
                "Ķ": "K",
                "Ḵ": "K",
                "Ƙ": "K",
                "Ⱪ": "K",
                "Ꝁ": "K",
                "Ꝃ": "K",
                "Ꝅ": "K",
                "Ꞣ": "K",
                "Ⓛ": "L",
                "Ｌ": "L",
                "Ŀ": "L",
                "Ĺ": "L",
                "Ľ": "L",
                "Ḷ": "L",
                "Ḹ": "L",
                "Ļ": "L",
                "Ḽ": "L",
                "Ḻ": "L",
                "Ł": "L",
                "Ƚ": "L",
                "Ɫ": "L",
                "Ⱡ": "L",
                "Ꝉ": "L",
                "Ꝇ": "L",
                "Ꞁ": "L",
                "Ǉ": "LJ",
                "ǈ": "Lj",
                "Ⓜ": "M",
                "Ｍ": "M",
                "Ḿ": "M",
                "Ṁ": "M",
                "Ṃ": "M",
                "Ɱ": "M",
                "Ɯ": "M",
                "Ⓝ": "N",
                "Ｎ": "N",
                "Ǹ": "N",
                "Ń": "N",
                "Ñ": "N",
                "Ṅ": "N",
                "Ň": "N",
                "Ṇ": "N",
                "Ņ": "N",
                "Ṋ": "N",
                "Ṉ": "N",
                "Ƞ": "N",
                "Ɲ": "N",
                "Ꞑ": "N",
                "Ꞥ": "N",
                "Ǌ": "NJ",
                "ǋ": "Nj",
                "Ⓞ": "O",
                "Ｏ": "O",
                "Ò": "O",
                "Ó": "O",
                "Ô": "O",
                "Ồ": "O",
                "Ố": "O",
                "Ỗ": "O",
                "Ổ": "O",
                "Õ": "O",
                "Ṍ": "O",
                "Ȭ": "O",
                "Ṏ": "O",
                "Ō": "O",
                "Ṑ": "O",
                "Ṓ": "O",
                "Ŏ": "O",
                "Ȯ": "O",
                "Ȱ": "O",
                "Ö": "O",
                "Ȫ": "O",
                "Ỏ": "O",
                "Ő": "O",
                "Ǒ": "O",
                "Ȍ": "O",
                "Ȏ": "O",
                "Ơ": "O",
                "Ờ": "O",
                "Ớ": "O",
                "Ỡ": "O",
                "Ở": "O",
                "Ợ": "O",
                "Ọ": "O",
                "Ộ": "O",
                "Ǫ": "O",
                "Ǭ": "O",
                "Ø": "O",
                "Ǿ": "O",
                "Ɔ": "O",
                "Ɵ": "O",
                "Ꝋ": "O",
                "Ꝍ": "O",
                "Œ": "OE",
                "Ƣ": "OI",
                "Ꝏ": "OO",
                "Ȣ": "OU",
                "Ⓟ": "P",
                "Ｐ": "P",
                "Ṕ": "P",
                "Ṗ": "P",
                "Ƥ": "P",
                "Ᵽ": "P",
                "Ꝑ": "P",
                "Ꝓ": "P",
                "Ꝕ": "P",
                "Ⓠ": "Q",
                "Ｑ": "Q",
                "Ꝗ": "Q",
                "Ꝙ": "Q",
                "Ɋ": "Q",
                "Ⓡ": "R",
                "Ｒ": "R",
                "Ŕ": "R",
                "Ṙ": "R",
                "Ř": "R",
                "Ȑ": "R",
                "Ȓ": "R",
                "Ṛ": "R",
                "Ṝ": "R",
                "Ŗ": "R",
                "Ṟ": "R",
                "Ɍ": "R",
                "Ɽ": "R",
                "Ꝛ": "R",
                "Ꞧ": "R",
                "Ꞃ": "R",
                "Ⓢ": "S",
                "Ｓ": "S",
                "ẞ": "S",
                "Ś": "S",
                "Ṥ": "S",
                "Ŝ": "S",
                "Ṡ": "S",
                "Š": "S",
                "Ṧ": "S",
                "Ṣ": "S",
                "Ṩ": "S",
                "Ș": "S",
                "Ş": "S",
                "Ȿ": "S",
                "Ꞩ": "S",
                "Ꞅ": "S",
                "Ⓣ": "T",
                "Ｔ": "T",
                "Ṫ": "T",
                "Ť": "T",
                "Ṭ": "T",
                "Ț": "T",
                "Ţ": "T",
                "Ṱ": "T",
                "Ṯ": "T",
                "Ŧ": "T",
                "Ƭ": "T",
                "Ʈ": "T",
                "Ⱦ": "T",
                "Ꞇ": "T",
                "Ꜩ": "TZ",
                "Ⓤ": "U",
                "Ｕ": "U",
                "Ù": "U",
                "Ú": "U",
                "Û": "U",
                "Ũ": "U",
                "Ṹ": "U",
                "Ū": "U",
                "Ṻ": "U",
                "Ŭ": "U",
                "Ü": "U",
                "Ǜ": "U",
                "Ǘ": "U",
                "Ǖ": "U",
                "Ǚ": "U",
                "Ủ": "U",
                "Ů": "U",
                "Ű": "U",
                "Ǔ": "U",
                "Ȕ": "U",
                "Ȗ": "U",
                "Ư": "U",
                "Ừ": "U",
                "Ứ": "U",
                "Ữ": "U",
                "Ử": "U",
                "Ự": "U",
                "Ụ": "U",
                "Ṳ": "U",
                "Ų": "U",
                "Ṷ": "U",
                "Ṵ": "U",
                "Ʉ": "U",
                "Ⓥ": "V",
                "Ｖ": "V",
                "Ṽ": "V",
                "Ṿ": "V",
                "Ʋ": "V",
                "Ꝟ": "V",
                "Ʌ": "V",
                "Ꝡ": "VY",
                "Ⓦ": "W",
                "Ｗ": "W",
                "Ẁ": "W",
                "Ẃ": "W",
                "Ŵ": "W",
                "Ẇ": "W",
                "Ẅ": "W",
                "Ẉ": "W",
                "Ⱳ": "W",
                "Ⓧ": "X",
                "Ｘ": "X",
                "Ẋ": "X",
                "Ẍ": "X",
                "Ⓨ": "Y",
                "Ｙ": "Y",
                "Ỳ": "Y",
                "Ý": "Y",
                "Ŷ": "Y",
                "Ỹ": "Y",
                "Ȳ": "Y",
                "Ẏ": "Y",
                "Ÿ": "Y",
                "Ỷ": "Y",
                "Ỵ": "Y",
                "Ƴ": "Y",
                "Ɏ": "Y",
                "Ỿ": "Y",
                "Ⓩ": "Z",
                "Ｚ": "Z",
                "Ź": "Z",
                "Ẑ": "Z",
                "Ż": "Z",
                "Ž": "Z",
                "Ẓ": "Z",
                "Ẕ": "Z",
                "Ƶ": "Z",
                "Ȥ": "Z",
                "Ɀ": "Z",
                "Ⱬ": "Z",
                "Ꝣ": "Z",
                "ⓐ": "a",
                "ａ": "a",
                "ẚ": "a",
                "à": "a",
                "á": "a",
                "â": "a",
                "ầ": "a",
                "ấ": "a",
                "ẫ": "a",
                "ẩ": "a",
                "ã": "a",
                "ā": "a",
                "ă": "a",
                "ằ": "a",
                "ắ": "a",
                "ẵ": "a",
                "ẳ": "a",
                "ȧ": "a",
                "ǡ": "a",
                "ä": "a",
                "ǟ": "a",
                "ả": "a",
                "å": "a",
                "ǻ": "a",
                "ǎ": "a",
                "ȁ": "a",
                "ȃ": "a",
                "ạ": "a",
                "ậ": "a",
                "ặ": "a",
                "ḁ": "a",
                "ą": "a",
                "ⱥ": "a",
                "ɐ": "a",
                "ꜳ": "aa",
                "æ": "ae",
                "ǽ": "ae",
                "ǣ": "ae",
                "ꜵ": "ao",
                "ꜷ": "au",
                "ꜹ": "av",
                "ꜻ": "av",
                "ꜽ": "ay",
                "ⓑ": "b",
                "ｂ": "b",
                "ḃ": "b",
                "ḅ": "b",
                "ḇ": "b",
                "ƀ": "b",
                "ƃ": "b",
                "ɓ": "b",
                "ⓒ": "c",
                "ｃ": "c",
                "ć": "c",
                "ĉ": "c",
                "ċ": "c",
                "č": "c",
                "ç": "c",
                "ḉ": "c",
                "ƈ": "c",
                "ȼ": "c",
                "ꜿ": "c",
                "ↄ": "c",
                "ⓓ": "d",
                "ｄ": "d",
                "ḋ": "d",
                "ď": "d",
                "ḍ": "d",
                "ḑ": "d",
                "ḓ": "d",
                "ḏ": "d",
                "đ": "d",
                "ƌ": "d",
                "ɖ": "d",
                "ɗ": "d",
                "ꝺ": "d",
                "ǳ": "dz",
                "ǆ": "dz",
                "ⓔ": "e",
                "ｅ": "e",
                "è": "e",
                "é": "e",
                "ê": "e",
                "ề": "e",
                "ế": "e",
                "ễ": "e",
                "ể": "e",
                "ẽ": "e",
                "ē": "e",
                "ḕ": "e",
                "ḗ": "e",
                "ĕ": "e",
                "ė": "e",
                "ë": "e",
                "ẻ": "e",
                "ě": "e",
                "ȅ": "e",
                "ȇ": "e",
                "ẹ": "e",
                "ệ": "e",
                "ȩ": "e",
                "ḝ": "e",
                "ę": "e",
                "ḙ": "e",
                "ḛ": "e",
                "ɇ": "e",
                "ɛ": "e",
                "ǝ": "e",
                "ⓕ": "f",
                "ｆ": "f",
                "ḟ": "f",
                "ƒ": "f",
                "ꝼ": "f",
                "ⓖ": "g",
                "ｇ": "g",
                "ǵ": "g",
                "ĝ": "g",
                "ḡ": "g",
                "ğ": "g",
                "ġ": "g",
                "ǧ": "g",
                "ģ": "g",
                "ǥ": "g",
                "ɠ": "g",
                "ꞡ": "g",
                "ᵹ": "g",
                "ꝿ": "g",
                "ⓗ": "h",
                "ｈ": "h",
                "ĥ": "h",
                "ḣ": "h",
                "ḧ": "h",
                "ȟ": "h",
                "ḥ": "h",
                "ḩ": "h",
                "ḫ": "h",
                "ẖ": "h",
                "ħ": "h",
                "ⱨ": "h",
                "ⱶ": "h",
                "ɥ": "h",
                "ƕ": "hv",
                "ⓘ": "i",
                "ｉ": "i",
                "ì": "i",
                "í": "i",
                "î": "i",
                "ĩ": "i",
                "ī": "i",
                "ĭ": "i",
                "ï": "i",
                "ḯ": "i",
                "ỉ": "i",
                "ǐ": "i",
                "ȉ": "i",
                "ȋ": "i",
                "ị": "i",
                "į": "i",
                "ḭ": "i",
                "ɨ": "i",
                "ı": "i",
                "ⓙ": "j",
                "ｊ": "j",
                "ĵ": "j",
                "ǰ": "j",
                "ɉ": "j",
                "ⓚ": "k",
                "ｋ": "k",
                "ḱ": "k",
                "ǩ": "k",
                "ḳ": "k",
                "ķ": "k",
                "ḵ": "k",
                "ƙ": "k",
                "ⱪ": "k",
                "ꝁ": "k",
                "ꝃ": "k",
                "ꝅ": "k",
                "ꞣ": "k",
                "ⓛ": "l",
                "ｌ": "l",
                "ŀ": "l",
                "ĺ": "l",
                "ľ": "l",
                "ḷ": "l",
                "ḹ": "l",
                "ļ": "l",
                "ḽ": "l",
                "ḻ": "l",
                "ſ": "l",
                "ł": "l",
                "ƚ": "l",
                "ɫ": "l",
                "ⱡ": "l",
                "ꝉ": "l",
                "ꞁ": "l",
                "ꝇ": "l",
                "ǉ": "lj",
                "ⓜ": "m",
                "ｍ": "m",
                "ḿ": "m",
                "ṁ": "m",
                "ṃ": "m",
                "ɱ": "m",
                "ɯ": "m",
                "ⓝ": "n",
                "ｎ": "n",
                "ǹ": "n",
                "ń": "n",
                "ñ": "n",
                "ṅ": "n",
                "ň": "n",
                "ṇ": "n",
                "ņ": "n",
                "ṋ": "n",
                "ṉ": "n",
                "ƞ": "n",
                "ɲ": "n",
                "ŉ": "n",
                "ꞑ": "n",
                "ꞥ": "n",
                "ǌ": "nj",
                "ⓞ": "o",
                "ｏ": "o",
                "ò": "o",
                "ó": "o",
                "ô": "o",
                "ồ": "o",
                "ố": "o",
                "ỗ": "o",
                "ổ": "o",
                "õ": "o",
                "ṍ": "o",
                "ȭ": "o",
                "ṏ": "o",
                "ō": "o",
                "ṑ": "o",
                "ṓ": "o",
                "ŏ": "o",
                "ȯ": "o",
                "ȱ": "o",
                "ö": "o",
                "ȫ": "o",
                "ỏ": "o",
                "ő": "o",
                "ǒ": "o",
                "ȍ": "o",
                "ȏ": "o",
                "ơ": "o",
                "ờ": "o",
                "ớ": "o",
                "ỡ": "o",
                "ở": "o",
                "ợ": "o",
                "ọ": "o",
                "ộ": "o",
                "ǫ": "o",
                "ǭ": "o",
                "ø": "o",
                "ǿ": "o",
                "ɔ": "o",
                "ꝋ": "o",
                "ꝍ": "o",
                "ɵ": "o",
                "œ": "oe",
                "ƣ": "oi",
                "ȣ": "ou",
                "ꝏ": "oo",
                "ⓟ": "p",
                "ｐ": "p",
                "ṕ": "p",
                "ṗ": "p",
                "ƥ": "p",
                "ᵽ": "p",
                "ꝑ": "p",
                "ꝓ": "p",
                "ꝕ": "p",
                "ⓠ": "q",
                "ｑ": "q",
                "ɋ": "q",
                "ꝗ": "q",
                "ꝙ": "q",
                "ⓡ": "r",
                "ｒ": "r",
                "ŕ": "r",
                "ṙ": "r",
                "ř": "r",
                "ȑ": "r",
                "ȓ": "r",
                "ṛ": "r",
                "ṝ": "r",
                "ŗ": "r",
                "ṟ": "r",
                "ɍ": "r",
                "ɽ": "r",
                "ꝛ": "r",
                "ꞧ": "r",
                "ꞃ": "r",
                "ⓢ": "s",
                "ｓ": "s",
                "ß": "s",
                "ś": "s",
                "ṥ": "s",
                "ŝ": "s",
                "ṡ": "s",
                "š": "s",
                "ṧ": "s",
                "ṣ": "s",
                "ṩ": "s",
                "ș": "s",
                "ş": "s",
                "ȿ": "s",
                "ꞩ": "s",
                "ꞅ": "s",
                "ẛ": "s",
                "ⓣ": "t",
                "ｔ": "t",
                "ṫ": "t",
                "ẗ": "t",
                "ť": "t",
                "ṭ": "t",
                "ț": "t",
                "ţ": "t",
                "ṱ": "t",
                "ṯ": "t",
                "ŧ": "t",
                "ƭ": "t",
                "ʈ": "t",
                "ⱦ": "t",
                "ꞇ": "t",
                "ꜩ": "tz",
                "ⓤ": "u",
                "ｕ": "u",
                "ù": "u",
                "ú": "u",
                "û": "u",
                "ũ": "u",
                "ṹ": "u",
                "ū": "u",
                "ṻ": "u",
                "ŭ": "u",
                "ü": "u",
                "ǜ": "u",
                "ǘ": "u",
                "ǖ": "u",
                "ǚ": "u",
                "ủ": "u",
                "ů": "u",
                "ű": "u",
                "ǔ": "u",
                "ȕ": "u",
                "ȗ": "u",
                "ư": "u",
                "ừ": "u",
                "ứ": "u",
                "ữ": "u",
                "ử": "u",
                "ự": "u",
                "ụ": "u",
                "ṳ": "u",
                "ų": "u",
                "ṷ": "u",
                "ṵ": "u",
                "ʉ": "u",
                "ⓥ": "v",
                "ｖ": "v",
                "ṽ": "v",
                "ṿ": "v",
                "ʋ": "v",
                "ꝟ": "v",
                "ʌ": "v",
                "ꝡ": "vy",
                "ⓦ": "w",
                "ｗ": "w",
                "ẁ": "w",
                "ẃ": "w",
                "ŵ": "w",
                "ẇ": "w",
                "ẅ": "w",
                "ẘ": "w",
                "ẉ": "w",
                "ⱳ": "w",
                "ⓧ": "x",
                "ｘ": "x",
                "ẋ": "x",
                "ẍ": "x",
                "ⓨ": "y",
                "ｙ": "y",
                "ỳ": "y",
                "ý": "y",
                "ŷ": "y",
                "ỹ": "y",
                "ȳ": "y",
                "ẏ": "y",
                "ÿ": "y",
                "ỷ": "y",
                "ẙ": "y",
                "ỵ": "y",
                "ƴ": "y",
                "ɏ": "y",
                "ỿ": "y",
                "ⓩ": "z",
                "ｚ": "z",
                "ź": "z",
                "ẑ": "z",
                "ż": "z",
                "ž": "z",
                "ẓ": "z",
                "ẕ": "z",
                "ƶ": "z",
                "ȥ": "z",
                "ɀ": "z",
                "ⱬ": "z",
                "ꝣ": "z",
                "Ά": "Α",
                "Έ": "Ε",
                "Ή": "Η",
                "Ί": "Ι",
                "Ϊ": "Ι",
                "Ό": "Ο",
                "Ύ": "Υ",
                "Ϋ": "Υ",
                "Ώ": "Ω",
                "ά": "α",
                "έ": "ε",
                "ή": "η",
                "ί": "ι",
                "ϊ": "ι",
                "ΐ": "ι",
                "ό": "ο",
                "ύ": "υ",
                "ϋ": "υ",
                "ΰ": "υ",
                "ώ": "ω",
                "ς": "σ",
                "’": "'"
            };
            return diacritics;
        });
        S2.define("select2/data/base", [ "../utils" ], function(Utils) {
            function BaseAdapter($element, options) {
                BaseAdapter.__super__.constructor.call(this);
            }
            Utils.Extend(BaseAdapter, Utils.Observable);
            BaseAdapter.prototype.current = function(callback) {
                throw new Error("The `current` method must be defined in child classes.");
            };
            BaseAdapter.prototype.query = function(params, callback) {
                throw new Error("The `query` method must be defined in child classes.");
            };
            BaseAdapter.prototype.bind = function(container, $container) {};
            BaseAdapter.prototype.destroy = function() {};
            BaseAdapter.prototype.generateResultId = function(container, data) {
                var id = container.id + "-result-";
                id += Utils.generateChars(4);
                if (data.id != null) {
                    id += "-" + data.id.toString();
                } else {
                    id += "-" + Utils.generateChars(4);
                }
                return id;
            };
            return BaseAdapter;
        });
        S2.define("select2/data/select", [ "./base", "../utils", "jquery" ], function(BaseAdapter, Utils, $) {
            function SelectAdapter($element, options) {
                this.$element = $element;
                this.options = options;
                SelectAdapter.__super__.constructor.call(this);
            }
            Utils.Extend(SelectAdapter, BaseAdapter);
            SelectAdapter.prototype.current = function(callback) {
                var self = this;
                var data = Array.prototype.map.call(this.$element[0].querySelectorAll(":checked"), function(selectedElement) {
                    return self.item($(selectedElement));
                });
                callback(data);
            };
            SelectAdapter.prototype.select = function(data) {
                var self = this;
                data.selected = true;
                if (data.element != null && data.element.tagName.toLowerCase() === "option") {
                    data.element.selected = true;
                    this.$element.trigger("input").trigger("change");
                    return;
                }
                if (this.$element.prop("multiple")) {
                    this.current(function(currentData) {
                        var val = [];
                        data = [ data ];
                        data.push.apply(data, currentData);
                        for (var d = 0; d < data.length; d++) {
                            var id = data[d].id;
                            if (val.indexOf(id) === -1) {
                                val.push(id);
                            }
                        }
                        self.$element.val(val);
                        self.$element.trigger("input").trigger("change");
                    });
                } else {
                    var val = data.id;
                    this.$element.val(val);
                    this.$element.trigger("input").trigger("change");
                }
            };
            SelectAdapter.prototype.unselect = function(data) {
                var self = this;
                if (!this.$element.prop("multiple")) {
                    return;
                }
                data.selected = false;
                if (data.element != null && data.element.tagName.toLowerCase() === "option") {
                    data.element.selected = false;
                    this.$element.trigger("input").trigger("change");
                    return;
                }
                this.current(function(currentData) {
                    var val = [];
                    for (var d = 0; d < currentData.length; d++) {
                        var id = currentData[d].id;
                        if (id !== data.id && val.indexOf(id) === -1) {
                            val.push(id);
                        }
                    }
                    self.$element.val(val);
                    self.$element.trigger("input").trigger("change");
                });
            };
            SelectAdapter.prototype.bind = function(container, $container) {
                var self = this;
                this.container = container;
                container.on("select", function(params) {
                    self.select(params.data);
                });
                container.on("unselect", function(params) {
                    self.unselect(params.data);
                });
            };
            SelectAdapter.prototype.destroy = function() {
                this.$element.find("*").each(function() {
                    Utils.RemoveData(this);
                });
            };
            SelectAdapter.prototype.query = function(params, callback) {
                var data = [];
                var self = this;
                var $options = this.$element.children();
                $options.each(function() {
                    if (this.tagName.toLowerCase() !== "option" && this.tagName.toLowerCase() !== "optgroup") {
                        return;
                    }
                    var $option = $(this);
                    var option = self.item($option);
                    var matches = self.matches(params, option);
                    if (matches !== null) {
                        data.push(matches);
                    }
                });
                callback({
                    results: data
                });
            };
            SelectAdapter.prototype.addOptions = function($options) {
                this.$element.append($options);
            };
            SelectAdapter.prototype.option = function(data) {
                var option;
                if (data.children) {
                    option = document.createElement("optgroup");
                    option.label = data.text;
                } else {
                    option = document.createElement("option");
                    if (option.textContent !== undefined) {
                        option.textContent = data.text;
                    } else {
                        option.innerText = data.text;
                    }
                }
                if (data.id !== undefined) {
                    option.value = data.id;
                }
                if (data.disabled) {
                    option.disabled = true;
                }
                if (data.selected) {
                    option.selected = true;
                }
                if (data.title) {
                    option.title = data.title;
                }
                var normalizedData = this._normalizeItem(data);
                normalizedData.element = option;
                Utils.StoreData(option, "data", normalizedData);
                return $(option);
            };
            SelectAdapter.prototype.item = function($option) {
                var data = {};
                data = Utils.GetData($option[0], "data");
                if (data != null) {
                    return data;
                }
                var option = $option[0];
                if (option.tagName.toLowerCase() === "option") {
                    data = {
                        id: $option.val(),
                        text: $option.text(),
                        disabled: $option.prop("disabled"),
                        selected: $option.prop("selected"),
                        title: $option.prop("title")
                    };
                } else if (option.tagName.toLowerCase() === "optgroup") {
                    data = {
                        text: $option.prop("label"),
                        children: [],
                        title: $option.prop("title")
                    };
                    var $children = $option.children("option");
                    var children = [];
                    for (var c = 0; c < $children.length; c++) {
                        var $child = $($children[c]);
                        var child = this.item($child);
                        children.push(child);
                    }
                    data.children = children;
                }
                data = this._normalizeItem(data);
                data.element = $option[0];
                Utils.StoreData($option[0], "data", data);
                return data;
            };
            SelectAdapter.prototype._normalizeItem = function(item) {
                if (item !== Object(item)) {
                    item = {
                        id: item,
                        text: item
                    };
                }
                item = $.extend({}, {
                    text: ""
                }, item);
                var defaults = {
                    selected: false,
                    disabled: false
                };
                if (item.id != null) {
                    item.id = item.id.toString();
                }
                if (item.text != null) {
                    item.text = item.text.toString();
                }
                if (item._resultId == null && item.id && this.container != null) {
                    item._resultId = this.generateResultId(this.container, item);
                }
                return $.extend({}, defaults, item);
            };
            SelectAdapter.prototype.matches = function(params, data) {
                var matcher = this.options.get("matcher");
                return matcher(params, data);
            };
            return SelectAdapter;
        });
        S2.define("select2/data/array", [ "./select", "../utils", "jquery" ], function(SelectAdapter, Utils, $) {
            function ArrayAdapter($element, options) {
                this._dataToConvert = options.get("data") || [];
                ArrayAdapter.__super__.constructor.call(this, $element, options);
            }
            Utils.Extend(ArrayAdapter, SelectAdapter);
            ArrayAdapter.prototype.bind = function(container, $container) {
                ArrayAdapter.__super__.bind.call(this, container, $container);
                this.addOptions(this.convertToOptions(this._dataToConvert));
            };
            ArrayAdapter.prototype.select = function(data) {
                var $option = this.$element.find("option").filter(function(i, elm) {
                    return elm.value == data.id.toString();
                });
                if ($option.length === 0) {
                    $option = this.option(data);
                    this.addOptions($option);
                }
                ArrayAdapter.__super__.select.call(this, data);
            };
            ArrayAdapter.prototype.convertToOptions = function(data) {
                var self = this;
                var $existing = this.$element.find("option");
                var existingIds = $existing.map(function() {
                    return self.item($(this)).id;
                }).get();
                var $options = [];
                function onlyItem(item) {
                    return function() {
                        return $(this).val() == item.id;
                    };
                }
                for (var d = 0; d < data.length; d++) {
                    var item = this._normalizeItem(data[d]);
                    if (existingIds.indexOf(item.id) >= 0) {
                        var $existingOption = $existing.filter(onlyItem(item));
                        var existingData = this.item($existingOption);
                        var newData = $.extend(true, {}, item, existingData);
                        var $newOption = this.option(newData);
                        $existingOption.replaceWith($newOption);
                        continue;
                    }
                    var $option = this.option(item);
                    if (item.children) {
                        var $children = this.convertToOptions(item.children);
                        $option.append($children);
                    }
                    $options.push($option);
                }
                return $options;
            };
            return ArrayAdapter;
        });
        S2.define("select2/data/ajax", [ "./array", "../utils", "jquery" ], function(ArrayAdapter, Utils, $) {
            function AjaxAdapter($element, options) {
                this.ajaxOptions = this._applyDefaults(options.get("ajax"));
                if (this.ajaxOptions.processResults != null) {
                    this.processResults = this.ajaxOptions.processResults;
                }
                AjaxAdapter.__super__.constructor.call(this, $element, options);
            }
            Utils.Extend(AjaxAdapter, ArrayAdapter);
            AjaxAdapter.prototype._applyDefaults = function(options) {
                var defaults = {
                    data: function(params) {
                        return $.extend({}, params, {
                            q: params.term
                        });
                    },
                    transport: function(params, success, failure) {
                        var $request = $.ajax(params);
                        $request.then(success);
                        $request.fail(failure);
                        return $request;
                    }
                };
                return $.extend({}, defaults, options, true);
            };
            AjaxAdapter.prototype.processResults = function(results) {
                return results;
            };
            AjaxAdapter.prototype.query = function(params, callback) {
                var matches = [];
                var self = this;
                if (this._request != null) {
                    if (typeof this._request.abort === "function") {
                        this._request.abort();
                    }
                    this._request = null;
                }
                var options = $.extend({
                    type: "GET"
                }, this.ajaxOptions);
                if (typeof options.url === "function") {
                    options.url = options.url.call(this.$element, params);
                }
                if (typeof options.data === "function") {
                    options.data = options.data.call(this.$element, params);
                }
                function request() {
                    var $request = options.transport(options, function(data) {
                        var results = self.processResults(data, params);
                        if (self.options.get("debug") && window.console && console.error) {
                            if (!results || !results.results || !Array.isArray(results.results)) {
                                console.error("Select2: The AJAX results did not return an array in the " + "`results` key of the response.");
                            }
                        }
                        callback(results);
                    }, function() {
                        if ("status" in $request && ($request.status === 0 || $request.status === "0")) {
                            return;
                        }
                        self.trigger("results:message", {
                            message: "errorLoading"
                        });
                    });
                    self._request = $request;
                }
                if (this.ajaxOptions.delay && params.term != null) {
                    if (this._queryTimeout) {
                        window.clearTimeout(this._queryTimeout);
                    }
                    this._queryTimeout = window.setTimeout(request, this.ajaxOptions.delay);
                } else {
                    request();
                }
            };
            return AjaxAdapter;
        });
        S2.define("select2/data/tags", [ "jquery" ], function($) {
            function Tags(decorated, $element, options) {
                var tags = options.get("tags");
                var createTag = options.get("createTag");
                if (createTag !== undefined) {
                    this.createTag = createTag;
                }
                var insertTag = options.get("insertTag");
                if (insertTag !== undefined) {
                    this.insertTag = insertTag;
                }
                decorated.call(this, $element, options);
                if (Array.isArray(tags)) {
                    for (var t = 0; t < tags.length; t++) {
                        var tag = tags[t];
                        var item = this._normalizeItem(tag);
                        var $option = this.option(item);
                        this.$element.append($option);
                    }
                }
            }
            Tags.prototype.query = function(decorated, params, callback) {
                var self = this;
                this._removeOldTags();
                if (params.term == null || params.page != null) {
                    decorated.call(this, params, callback);
                    return;
                }
                function wrapper(obj, child) {
                    var data = obj.results;
                    for (var i = 0; i < data.length; i++) {
                        var option = data[i];
                        var checkChildren = option.children != null && !wrapper({
                            results: option.children
                        }, true);
                        var optionText = (option.text || "").toUpperCase();
                        var paramsTerm = (params.term || "").toUpperCase();
                        var checkText = optionText === paramsTerm;
                        if (checkText || checkChildren) {
                            if (child) {
                                return false;
                            }
                            obj.data = data;
                            callback(obj);
                            return;
                        }
                    }
                    if (child) {
                        return true;
                    }
                    var tag = self.createTag(params);
                    if (tag != null) {
                        var $option = self.option(tag);
                        $option.attr("data-select2-tag", "true");
                        self.addOptions([ $option ]);
                        self.insertTag(data, tag);
                    }
                    obj.results = data;
                    callback(obj);
                }
                decorated.call(this, params, wrapper);
            };
            Tags.prototype.createTag = function(decorated, params) {
                if (params.term == null) {
                    return null;
                }
                var term = params.term.trim();
                if (term === "") {
                    return null;
                }
                return {
                    id: term,
                    text: term
                };
            };
            Tags.prototype.insertTag = function(_, data, tag) {
                data.unshift(tag);
            };
            Tags.prototype._removeOldTags = function(_) {
                var $options = this.$element.find("option[data-select2-tag]");
                $options.each(function() {
                    if (this.selected) {
                        return;
                    }
                    $(this).remove();
                });
            };
            return Tags;
        });
        S2.define("select2/data/tokenizer", [ "jquery" ], function($) {
            function Tokenizer(decorated, $element, options) {
                var tokenizer = options.get("tokenizer");
                if (tokenizer !== undefined) {
                    this.tokenizer = tokenizer;
                }
                decorated.call(this, $element, options);
            }
            Tokenizer.prototype.bind = function(decorated, container, $container) {
                decorated.call(this, container, $container);
                this.$search = container.dropdown.$search || container.selection.$search || $container.find(".select2-search__field");
            };
            Tokenizer.prototype.query = function(decorated, params, callback) {
                var self = this;
                function createAndSelect(data) {
                    var item = self._normalizeItem(data);
                    var $existingOptions = self.$element.find("option").filter(function() {
                        return $(this).val() === item.id;
                    });
                    if (!$existingOptions.length) {
                        var $option = self.option(item);
                        $option.attr("data-select2-tag", true);
                        self._removeOldTags();
                        self.addOptions([ $option ]);
                    }
                    select(item);
                }
                function select(data) {
                    self.trigger("select", {
                        data: data
                    });
                }
                params.term = params.term || "";
                var tokenData = this.tokenizer(params, this.options, createAndSelect);
                if (tokenData.term !== params.term) {
                    if (this.$search.length) {
                        this.$search.val(tokenData.term);
                        this.$search.trigger("focus");
                    }
                    params.term = tokenData.term;
                }
                decorated.call(this, params, callback);
            };
            Tokenizer.prototype.tokenizer = function(_, params, options, callback) {
                var separators = options.get("tokenSeparators") || [];
                var term = params.term;
                var i = 0;
                var createTag = this.createTag || function(params) {
                    return {
                        id: params.term,
                        text: params.term
                    };
                };
                while (i < term.length) {
                    var termChar = term[i];
                    if (separators.indexOf(termChar) === -1) {
                        i++;
                        continue;
                    }
                    var part = term.substr(0, i);
                    var partParams = $.extend({}, params, {
                        term: part
                    });
                    var data = createTag(partParams);
                    if (data == null) {
                        i++;
                        continue;
                    }
                    callback(data);
                    term = term.substr(i + 1) || "";
                    i = 0;
                }
                return {
                    term: term
                };
            };
            return Tokenizer;
        });
        S2.define("select2/data/minimumInputLength", [], function() {
            function MinimumInputLength(decorated, $e, options) {
                this.minimumInputLength = options.get("minimumInputLength");
                decorated.call(this, $e, options);
            }
            MinimumInputLength.prototype.query = function(decorated, params, callback) {
                params.term = params.term || "";
                if (params.term.length < this.minimumInputLength) {
                    this.trigger("results:message", {
                        message: "inputTooShort",
                        args: {
                            minimum: this.minimumInputLength,
                            input: params.term,
                            params: params
                        }
                    });
                    return;
                }
                decorated.call(this, params, callback);
            };
            return MinimumInputLength;
        });
        S2.define("select2/data/maximumInputLength", [], function() {
            function MaximumInputLength(decorated, $e, options) {
                this.maximumInputLength = options.get("maximumInputLength");
                decorated.call(this, $e, options);
            }
            MaximumInputLength.prototype.query = function(decorated, params, callback) {
                params.term = params.term || "";
                if (this.maximumInputLength > 0 && params.term.length > this.maximumInputLength) {
                    this.trigger("results:message", {
                        message: "inputTooLong",
                        args: {
                            maximum: this.maximumInputLength,
                            input: params.term,
                            params: params
                        }
                    });
                    return;
                }
                decorated.call(this, params, callback);
            };
            return MaximumInputLength;
        });
        S2.define("select2/data/maximumSelectionLength", [], function() {
            function MaximumSelectionLength(decorated, $e, options) {
                this.maximumSelectionLength = options.get("maximumSelectionLength");
                decorated.call(this, $e, options);
            }
            MaximumSelectionLength.prototype.bind = function(decorated, container, $container) {
                var self = this;
                decorated.call(this, container, $container);
                container.on("select", function() {
                    self._checkIfMaximumSelected();
                });
            };
            MaximumSelectionLength.prototype.query = function(decorated, params, callback) {
                var self = this;
                this._checkIfMaximumSelected(function() {
                    decorated.call(self, params, callback);
                });
            };
            MaximumSelectionLength.prototype._checkIfMaximumSelected = function(_, successCallback) {
                var self = this;
                this.current(function(currentData) {
                    var count = currentData != null ? currentData.length : 0;
                    if (self.maximumSelectionLength > 0 && count >= self.maximumSelectionLength) {
                        self.trigger("results:message", {
                            message: "maximumSelected",
                            args: {
                                maximum: self.maximumSelectionLength
                            }
                        });
                        return;
                    }
                    if (successCallback) {
                        successCallback();
                    }
                });
            };
            return MaximumSelectionLength;
        });
        S2.define("select2/dropdown", [ "jquery", "./utils" ], function($, Utils) {
            function Dropdown($element, options) {
                this.$element = $element;
                this.options = options;
                Dropdown.__super__.constructor.call(this);
            }
            Utils.Extend(Dropdown, Utils.Observable);
            Dropdown.prototype.render = function() {
                var $dropdown = $('<span class="select2-dropdown">' + '<span class="select2-results"></span>' + "</span>");
                $dropdown.attr("dir", this.options.get("dir"));
                this.$dropdown = $dropdown;
                return $dropdown;
            };
            Dropdown.prototype.bind = function() {};
            Dropdown.prototype.position = function($dropdown, $container) {};
            Dropdown.prototype.destroy = function() {
                this.$dropdown.remove();
            };
            return Dropdown;
        });
        S2.define("select2/dropdown/search", [ "jquery" ], function($) {
            function Search() {}
            Search.prototype.render = function(decorated) {
                var $rendered = decorated.call(this);
                var searchLabel = this.options.get("translations").get("search");
                var $search = $('<span class="select2-search select2-search--dropdown">' + '<input class="select2-search__field" type="search" tabindex="-1"' + ' placeholder="search..."' + ' autocorrect="off" autocapitalize="none"' + ' spellcheck="false" role="searchbox" aria-autocomplete="list" />' + "</span>");
                this.$searchContainer = $search;
                this.$search = $search.find("input");
                this.$search.prop("autocomplete", this.options.get("autocomplete"));
                this.$search.attr("aria-label", searchLabel());
                $rendered.prepend($search);
                return $rendered;
            };
            Search.prototype.bind = function(decorated, container, $container) {
                var self = this;
                var resultsId = container.id + "-results";
                decorated.call(this, container, $container);
                this.$search.on("keydown", function(evt) {
                    self.trigger("keypress", evt);
                    self._keyUpPrevented = evt.isDefaultPrevented();
                });
                this.$search.on("input", function(evt) {
                    $(this).off("keyup");
                });
                this.$search.on("keyup input", function(evt) {
                    self.handleSearch(evt);
                });
                container.on("open", function() {
                    self.$search.attr("tabindex", 0);
                    self.$search.attr("aria-controls", resultsId);
                    self.$search.trigger("focus");
                    window.setTimeout(function() {
                        self.$search.trigger("focus");
                    }, 0);
                });
                container.on("close", function() {
                    self.$search.attr("tabindex", -1);
                    self.$search.removeAttr("aria-controls");
                    self.$search.removeAttr("aria-activedescendant");
                    self.$search.val("");
                    self.$search.trigger("blur");
                });
                container.on("focus", function() {
                    if (!container.isOpen()) {
                        self.$search.trigger("focus");
                    }
                });
                container.on("results:all", function(params) {
                    if (params.query.term == null || params.query.term === "") {
                        var showSearch = self.showSearch(params);
                        if (showSearch) {
                            self.$searchContainer[0].classList.remove("select2-search--hide");
                        } else {
                            self.$searchContainer[0].classList.add("select2-search--hide");
                        }
                    }
                });
                container.on("results:focus", function(params) {
                    if (params.data._resultId) {
                        self.$search.attr("aria-activedescendant", params.data._resultId);
                    } else {
                        self.$search.removeAttr("aria-activedescendant");
                    }
                });
            };
            Search.prototype.handleSearch = function(evt) {
                if (!this._keyUpPrevented) {
                    var input = this.$search.val();
                    this.trigger("query", {
                        term: input
                    });
                }
                this._keyUpPrevented = false;
            };
            Search.prototype.showSearch = function(_, params) {
                return true;
            };
            return Search;
        });
        S2.define("select2/dropdown/hidePlaceholder", [], function() {
            function HidePlaceholder(decorated, $element, options, dataAdapter) {
                this.placeholder = this.normalizePlaceholder(options.get("placeholder"));
                decorated.call(this, $element, options, dataAdapter);
            }
            HidePlaceholder.prototype.append = function(decorated, data) {
                data.results = this.removePlaceholder(data.results);
                decorated.call(this, data);
            };
            HidePlaceholder.prototype.normalizePlaceholder = function(_, placeholder) {
                if (typeof placeholder === "string") {
                    placeholder = {
                        id: "",
                        text: placeholder
                    };
                }
                return placeholder;
            };
            HidePlaceholder.prototype.removePlaceholder = function(_, data) {
                var modifiedData = data.slice(0);
                for (var d = data.length - 1; d >= 0; d--) {
                    var item = data[d];
                    if (this.placeholder.id === item.id) {
                        modifiedData.splice(d, 1);
                    }
                }
                return modifiedData;
            };
            return HidePlaceholder;
        });
        S2.define("select2/dropdown/infiniteScroll", [ "jquery" ], function($) {
            function InfiniteScroll(decorated, $element, options, dataAdapter) {
                this.lastParams = {};
                decorated.call(this, $element, options, dataAdapter);
                this.$loadingMore = this.createLoadingMore();
                this.loading = false;
            }
            InfiniteScroll.prototype.append = function(decorated, data) {
                this.$loadingMore.remove();
                this.loading = false;
                decorated.call(this, data);
                if (this.showLoadingMore(data)) {
                    this.$results.append(this.$loadingMore);
                    this.loadMoreIfNeeded();
                }
            };
            InfiniteScroll.prototype.bind = function(decorated, container, $container) {
                var self = this;
                decorated.call(this, container, $container);
                container.on("query", function(params) {
                    self.lastParams = params;
                    self.loading = true;
                });
                container.on("query:append", function(params) {
                    self.lastParams = params;
                    self.loading = true;
                });
                this.$results.on("scroll", this.loadMoreIfNeeded.bind(this));
            };
            InfiniteScroll.prototype.loadMoreIfNeeded = function() {
                var isLoadMoreVisible = $.contains(document.documentElement, this.$loadingMore[0]);
                if (this.loading || !isLoadMoreVisible) {
                    return;
                }
                var currentOffset = this.$results.offset().top + this.$results.outerHeight(false);
                var loadingMoreOffset = this.$loadingMore.offset().top + this.$loadingMore.outerHeight(false);
                if (currentOffset + 50 >= loadingMoreOffset) {
                    this.loadMore();
                }
            };
            InfiniteScroll.prototype.loadMore = function() {
                this.loading = true;
                var params = $.extend({}, {
                    page: 1
                }, this.lastParams);
                params.page++;
                this.trigger("query:append", params);
            };
            InfiniteScroll.prototype.showLoadingMore = function(_, data) {
                return data.pagination && data.pagination.more;
            };
            InfiniteScroll.prototype.createLoadingMore = function() {
                var $option = $("<li " + 'class="select2-results__option select2-results__option--load-more"' + 'role="option" aria-disabled="true"></li>');
                var message = this.options.get("translations").get("loadingMore");
                $option.html(message(this.lastParams));
                return $option;
            };
            return InfiniteScroll;
        });
        S2.define("select2/dropdown/attachBody", [ "jquery", "../utils" ], function($, Utils) {
            function AttachBody(decorated, $element, options) {
                this.$dropdownParent = $(options.get("dropdownParent") || document.body);
                decorated.call(this, $element, options);
            }
            AttachBody.prototype.bind = function(decorated, container, $container) {
                var self = this;
                decorated.call(this, container, $container);
                container.on("open", function() {
                    self._showDropdown();
                    self._attachPositioningHandler(container);
                    self._bindContainerResultHandlers(container);
                });
                container.on("close", function() {
                    self._hideDropdown();
                    self._detachPositioningHandler(container);
                });
                this.$dropdownContainer.on("mousedown", function(evt) {
                    evt.stopPropagation();
                });
            };
            AttachBody.prototype.destroy = function(decorated) {
                decorated.call(this);
                this.$dropdownContainer.remove();
            };
            AttachBody.prototype.position = function(decorated, $dropdown, $container) {
                $dropdown.attr("class", $container.attr("class"));
                $dropdown[0].classList.remove("select2");
                $dropdown[0].classList.add("select2-container--open");
                $dropdown.css({
                    position: "absolute",
                    top: -999999
                });
                this.$container = $container;
            };
            AttachBody.prototype.render = function(decorated) {
                var $container = $("<span></span>");
                var $dropdown = decorated.call(this);
                $container.append($dropdown);
                this.$dropdownContainer = $container;
                return $container;
            };
            AttachBody.prototype._hideDropdown = function(decorated) {
                this.$dropdownContainer.detach();
            };
            AttachBody.prototype._bindContainerResultHandlers = function(decorated, container) {
                if (this._containerResultsHandlersBound) {
                    return;
                }
                var self = this;
                container.on("results:all", function() {
                    self._positionDropdown();
                    self._resizeDropdown();
                });
                container.on("results:append", function() {
                    self._positionDropdown();
                    self._resizeDropdown();
                });
                container.on("results:message", function() {
                    self._positionDropdown();
                    self._resizeDropdown();
                });
                container.on("select", function() {
                    self._positionDropdown();
                    self._resizeDropdown();
                });
                container.on("unselect", function() {
                    self._positionDropdown();
                    self._resizeDropdown();
                });
                this._containerResultsHandlersBound = true;
            };
            AttachBody.prototype._attachPositioningHandler = function(decorated, container) {
                var self = this;
                var scrollEvent = "scroll.select2." + container.id;
                var resizeEvent = "resize.select2." + container.id;
                var orientationEvent = "orientationchange.select2." + container.id;
                var $watchers = this.$container.parents().filter(Utils.hasScroll);
                $watchers.each(function() {
                    Utils.StoreData(this, "select2-scroll-position", {
                        x: $(this).scrollLeft(),
                        y: $(this).scrollTop()
                    });
                });
                $watchers.on(scrollEvent, function(ev) {
                    var position = Utils.GetData(this, "select2-scroll-position");
                    $(this).scrollTop(position.y);
                });
                $(window).on(scrollEvent + " " + resizeEvent + " " + orientationEvent, function(e) {
                    self._positionDropdown();
                    self._resizeDropdown();
                });
            };
            AttachBody.prototype._detachPositioningHandler = function(decorated, container) {
                var scrollEvent = "scroll.select2." + container.id;
                var resizeEvent = "resize.select2." + container.id;
                var orientationEvent = "orientationchange.select2." + container.id;
                var $watchers = this.$container.parents().filter(Utils.hasScroll);
                $watchers.off(scrollEvent);
                $(window).off(scrollEvent + " " + resizeEvent + " " + orientationEvent);
            };
            AttachBody.prototype._positionDropdown = function() {
                var $window = $(window);
                var isCurrentlyAbove = this.$dropdown[0].classList.contains("select2-dropdown--above");
                var isCurrentlyBelow = this.$dropdown[0].classList.contains("select2-dropdown--below");
                var newDirection = null;
                var offset = this.$container.offset();
                offset.bottom = offset.top + this.$container.outerHeight(false);
                var container = {
                    height: this.$container.outerHeight(false)
                };
                container.top = offset.top;
                container.bottom = offset.top + container.height;
                var dropdown = {
                    height: this.$dropdown.outerHeight(false)
                };
                var viewport = {
                    top: $window.scrollTop(),
                    bottom: $window.scrollTop() + $window.height()
                };
                var enoughRoomAbove = viewport.top < offset.top - dropdown.height;
                var enoughRoomBelow = viewport.bottom > offset.bottom + dropdown.height;
                var css = {
                    left: offset.left,
                    top: container.bottom
                };
                var $offsetParent = this.$dropdownParent;
                if ($offsetParent.css("position") === "static") {
                    $offsetParent = $offsetParent.offsetParent();
                }
                var parentOffset = {
                    top: 0,
                    left: 0
                };
                if ($.contains(document.body, $offsetParent[0]) || $offsetParent[0].isConnected) {
                    parentOffset = $offsetParent.offset();
                }
                css.top -= parentOffset.top;
                css.left -= parentOffset.left;
                if (!isCurrentlyAbove && !isCurrentlyBelow) {
                    newDirection = "below";
                }
                if (!enoughRoomBelow && enoughRoomAbove && !isCurrentlyAbove) {
                    newDirection = "above";
                } else if (!enoughRoomAbove && enoughRoomBelow && isCurrentlyAbove) {
                    newDirection = "below";
                }
                if (newDirection == "above" || isCurrentlyAbove && newDirection !== "below") {
                    css.top = container.top - parentOffset.top - dropdown.height;
                }
                if (newDirection != null) {
                    this.$dropdown[0].classList.remove("select2-dropdown--below");
                    this.$dropdown[0].classList.remove("select2-dropdown--above");
                    this.$dropdown[0].classList.add("select2-dropdown--" + newDirection);
                    this.$container[0].classList.remove("select2-container--below");
                    this.$container[0].classList.remove("select2-container--above");
                    this.$container[0].classList.add("select2-container--" + newDirection);
                }
                this.$dropdownContainer.css(css);
            };
            AttachBody.prototype._resizeDropdown = function() {
                var css = {
                    width: this.$container.outerWidth(false) + "px"
                };
                if (this.options.get("dropdownAutoWidth")) {
                    css.minWidth = css.width;
                    css.position = "relative";
                    css.width = "auto";
                }
                this.$dropdown.css(css);
            };
            AttachBody.prototype._showDropdown = function(decorated) {
                this.$dropdownContainer.appendTo(this.$dropdownParent);
                this._positionDropdown();
                this._resizeDropdown();
            };
            return AttachBody;
        });
        S2.define("select2/dropdown/minimumResultsForSearch", [], function() {
            function countResults(data) {
                var count = 0;
                for (var d = 0; d < data.length; d++) {
                    var item = data[d];
                    if (item.children) {
                        count += countResults(item.children);
                    } else {
                        count++;
                    }
                }
                return count;
            }
            function MinimumResultsForSearch(decorated, $element, options, dataAdapter) {
                this.minimumResultsForSearch = options.get("minimumResultsForSearch");
                if (this.minimumResultsForSearch < 0) {
                    this.minimumResultsForSearch = Infinity;
                }
                decorated.call(this, $element, options, dataAdapter);
            }
            MinimumResultsForSearch.prototype.showSearch = function(decorated, params) {
                if (countResults(params.data.results) < this.minimumResultsForSearch) {
                    return false;
                }
                return decorated.call(this, params);
            };
            return MinimumResultsForSearch;
        });
        S2.define("select2/dropdown/selectOnClose", [ "../utils" ], function(Utils) {
            function SelectOnClose() {}
            SelectOnClose.prototype.bind = function(decorated, container, $container) {
                var self = this;
                decorated.call(this, container, $container);
                container.on("close", function(params) {
                    self._handleSelectOnClose(params);
                });
            };
            SelectOnClose.prototype._handleSelectOnClose = function(_, params) {
                if (params && params.originalSelect2Event != null) {
                    var event = params.originalSelect2Event;
                    if (event._type === "select" || event._type === "unselect") {
                        return;
                    }
                }
                var $highlightedResults = this.getHighlightedResults();
                if ($highlightedResults.length < 1) {
                    return;
                }
                var data = Utils.GetData($highlightedResults[0], "data");
                if (data.element != null && data.element.selected || data.element == null && data.selected) {
                    return;
                }
                this.trigger("select", {
                    data: data
                });
            };
            return SelectOnClose;
        });
        S2.define("select2/dropdown/closeOnSelect", [], function() {
            function CloseOnSelect() {}
            CloseOnSelect.prototype.bind = function(decorated, container, $container) {
                var self = this;
                decorated.call(this, container, $container);
                container.on("select", function(evt) {
                    self._selectTriggered(evt);
                });
                container.on("unselect", function(evt) {
                    self._selectTriggered(evt);
                });
            };
            CloseOnSelect.prototype._selectTriggered = function(_, evt) {
                var originalEvent = evt.originalEvent;
                if (originalEvent && (originalEvent.ctrlKey || originalEvent.metaKey)) {
                    return;
                }
                this.trigger("close", {
                    originalEvent: originalEvent,
                    originalSelect2Event: evt
                });
            };
            return CloseOnSelect;
        });
        S2.define("select2/dropdown/dropdownCss", [ "../utils" ], function(Utils) {
            function DropdownCSS() {}
            DropdownCSS.prototype.render = function(decorated) {
                var $dropdown = decorated.call(this);
                var dropdownCssClass = this.options.get("dropdownCssClass") || "";
                if (dropdownCssClass.indexOf(":all:") !== -1) {
                    dropdownCssClass = dropdownCssClass.replace(":all:", "");
                    Utils.copyNonInternalCssClasses($dropdown[0], this.$element[0]);
                }
                $dropdown.addClass(dropdownCssClass);
                return $dropdown;
            };
            return DropdownCSS;
        });
        S2.define("select2/dropdown/tagsSearchHighlight", [ "../utils" ], function(Utils) {
            function TagsSearchHighlight() {}
            TagsSearchHighlight.prototype.highlightFirstItem = function(decorated) {
                var $options = this.$results.find(".select2-results__option--selectable" + ":not(.select2-results__option--selected)");
                if ($options.length > 0) {
                    var $firstOption = $options.first();
                    var data = Utils.GetData($firstOption[0], "data");
                    var firstElement = data.element;
                    if (firstElement && firstElement.getAttribute) {
                        if (firstElement.getAttribute("data-select2-tag") === "true") {
                            $firstOption.trigger("mouseenter");
                            return;
                        }
                    }
                }
                decorated.call(this);
            };
            return TagsSearchHighlight;
        });
        S2.define("select2/i18n/en", [], function() {
            return {
                errorLoading: function() {
                    return "The results could not be loaded.";
                },
                inputTooLong: function(args) {
                    var overChars = args.input.length - args.maximum;
                    var message = "Please delete " + overChars + " character";
                    if (overChars != 1) {
                        message += "s";
                    }
                    return message;
                },
                inputTooShort: function(args) {
                    var remainingChars = args.minimum - args.input.length;
                    var message = "Please enter " + remainingChars + " or more characters";
                    return message;
                },
                loadingMore: function() {
                    return "Loading more results…";
                },
                maximumSelected: function(args) {
                    var message = "You can only select " + args.maximum + " item";
                    if (args.maximum != 1) {
                        message += "s";
                    }
                    return message;
                },
                noResults: function() {
                    return "No results found";
                },
                searching: function() {
                    return "Searching…";
                },
                removeAllItems: function() {
                    return "Remove all items";
                },
                removeItem: function() {
                    return "Remove item";
                },
                search: function() {
                    return "Search";
                }
            };
        });
        S2.define("select2/defaults", [ "jquery", "./results", "./selection/single", "./selection/multiple", "./selection/placeholder", "./selection/allowClear", "./selection/search", "./selection/selectionCss", "./selection/eventRelay", "./utils", "./translation", "./diacritics", "./data/select", "./data/array", "./data/ajax", "./data/tags", "./data/tokenizer", "./data/minimumInputLength", "./data/maximumInputLength", "./data/maximumSelectionLength", "./dropdown", "./dropdown/search", "./dropdown/hidePlaceholder", "./dropdown/infiniteScroll", "./dropdown/attachBody", "./dropdown/minimumResultsForSearch", "./dropdown/selectOnClose", "./dropdown/closeOnSelect", "./dropdown/dropdownCss", "./dropdown/tagsSearchHighlight", "./i18n/en" ], function($, ResultsList, SingleSelection, MultipleSelection, Placeholder, AllowClear, SelectionSearch, SelectionCSS, EventRelay, Utils, Translation, DIACRITICS, SelectData, ArrayData, AjaxData, Tags, Tokenizer, MinimumInputLength, MaximumInputLength, MaximumSelectionLength, Dropdown, DropdownSearch, HidePlaceholder, InfiniteScroll, AttachBody, MinimumResultsForSearch, SelectOnClose, CloseOnSelect, DropdownCSS, TagsSearchHighlight, EnglishTranslation) {
            function Defaults() {
                this.reset();
            }
            Defaults.prototype.apply = function(options) {
                options = $.extend(true, {}, this.defaults, options);
                if (options.dataAdapter == null) {
                    if (options.ajax != null) {
                        options.dataAdapter = AjaxData;
                    } else if (options.data != null) {
                        options.dataAdapter = ArrayData;
                    } else {
                        options.dataAdapter = SelectData;
                    }
                    if (options.minimumInputLength > 0) {
                        options.dataAdapter = Utils.Decorate(options.dataAdapter, MinimumInputLength);
                    }
                    if (options.maximumInputLength > 0) {
                        options.dataAdapter = Utils.Decorate(options.dataAdapter, MaximumInputLength);
                    }
                    if (options.maximumSelectionLength > 0) {
                        options.dataAdapter = Utils.Decorate(options.dataAdapter, MaximumSelectionLength);
                    }
                    if (options.tags) {
                        options.dataAdapter = Utils.Decorate(options.dataAdapter, Tags);
                    }
                    if (options.tokenSeparators != null || options.tokenizer != null) {
                        options.dataAdapter = Utils.Decorate(options.dataAdapter, Tokenizer);
                    }
                }
                if (options.resultsAdapter == null) {
                    options.resultsAdapter = ResultsList;
                    if (options.ajax != null) {
                        options.resultsAdapter = Utils.Decorate(options.resultsAdapter, InfiniteScroll);
                    }
                    if (options.placeholder != null) {
                        options.resultsAdapter = Utils.Decorate(options.resultsAdapter, HidePlaceholder);
                    }
                    if (options.selectOnClose) {
                        options.resultsAdapter = Utils.Decorate(options.resultsAdapter, SelectOnClose);
                    }
                    if (options.tags) {
                        options.resultsAdapter = Utils.Decorate(options.resultsAdapter, TagsSearchHighlight);
                    }
                }
                if (options.dropdownAdapter == null) {
                    if (options.multiple) {
                        options.dropdownAdapter = Dropdown;
                    } else {
                        var SearchableDropdown = Utils.Decorate(Dropdown, DropdownSearch);
                        options.dropdownAdapter = SearchableDropdown;
                    }
                    if (options.minimumResultsForSearch !== 0) {
                        options.dropdownAdapter = Utils.Decorate(options.dropdownAdapter, MinimumResultsForSearch);
                    }
                    if (options.closeOnSelect) {
                        options.dropdownAdapter = Utils.Decorate(options.dropdownAdapter, CloseOnSelect);
                    }
                    if (options.dropdownCssClass != null) {
                        options.dropdownAdapter = Utils.Decorate(options.dropdownAdapter, DropdownCSS);
                    }
                    options.dropdownAdapter = Utils.Decorate(options.dropdownAdapter, AttachBody);
                }
                if (options.selectionAdapter == null) {
                    if (options.multiple) {
                        options.selectionAdapter = MultipleSelection;
                    } else {
                        options.selectionAdapter = SingleSelection;
                    }
                    if (options.placeholder != null) {
                        options.selectionAdapter = Utils.Decorate(options.selectionAdapter, Placeholder);
                    }
                    if (options.allowClearing) {
                        options.selectionAdapter = Utils.Decorate(options.selectionAdapter, AllowClear);
                    }
                    if (options.multiple) {
                        options.selectionAdapter = Utils.Decorate(options.selectionAdapter, SelectionSearch);
                    }
                    if (options.selectionCssClass != null) {
                        options.selectionAdapter = Utils.Decorate(options.selectionAdapter, SelectionCSS);
                    }
                    options.selectionAdapter = Utils.Decorate(options.selectionAdapter, EventRelay);
                }
                options.language = this._resolveLanguage(options.language);
                options.language.push("en");
                var uniqueLanguages = [];
                for (var l = 0; l < options.language.length; l++) {
                    var language = options.language[l];
                    if (uniqueLanguages.indexOf(language) === -1) {
                        uniqueLanguages.push(language);
                    }
                }
                options.language = uniqueLanguages;
                options.translations = this._processTranslations(options.language, options.debug);
                return options;
            };
            Defaults.prototype.reset = function() {
                function stripDiacritics(text) {
                    function match(a) {
                        return DIACRITICS[a] || a;
                    }
                    return text.replace(/[^\u0000-\u007E]/g, match);
                }
                function matcher(params, data) {
                    if (params.term == null || params.term.trim() === "") {
                        return data;
                    }
                    if (data.children && data.children.length > 0) {
                        var match = $.extend(true, {}, data);
                        for (var c = data.children.length - 1; c >= 0; c--) {
                            var child = data.children[c];
                            var matches = matcher(params, child);
                            if (matches == null) {
                                match.children.splice(c, 1);
                            }
                        }
                        if (match.children.length > 0) {
                            return match;
                        }
                        return matcher(params, match);
                    }
                    var original = stripDiacritics(data.text).toUpperCase();
                    var term = stripDiacritics(params.term).toUpperCase();
                    if (original.indexOf(term) > -1) {
                        return data;
                    }
                    return null;
                }
                this.defaults = {
                    amdLanguageBase: "./i18n/",
                    autocomplete: "off",
                    closeOnSelect: true,
                    debug: false,
                    dropdownAutoWidth: false,
                    escapeMarkup: Utils.escapeMarkup,
                    language: {},
                    matcher: matcher,
                    minimumInputLength: 0,
                    maximumInputLength: 0,
                    maximumSelectionLength: 0,
                    minimumResultsForSearch: 0,
                    selectOnClose: false,
                    scrollAfterSelect: false,
                    sorter: function(data) {
                        return data;
                    },
                    templateResult: function(result) {
                        return result.text;
                    },
                    templateSelection: function(selection) {
                        return selection.text;
                    },
                    theme: "default",
                    width: "resolve"
                };
            };
            Defaults.prototype.applyFromElement = function(options, $element) {
                var optionLanguage = options.language;
                var defaultLanguage = this.defaults.language;
                var elementLanguage = $element.prop("lang");
                var parentLanguage = $element.closest("[lang]").prop("lang");
                var languages = Array.prototype.concat.call(this._resolveLanguage(elementLanguage), this._resolveLanguage(optionLanguage), this._resolveLanguage(defaultLanguage), this._resolveLanguage(parentLanguage));
                options.language = languages;
                return options;
            };
            Defaults.prototype._resolveLanguage = function(language) {
                if (!language) {
                    return [];
                }
                if ($.isEmptyObject(language)) {
                    return [];
                }
                if ($.isPlainObject(language)) {
                    return [ language ];
                }
                var languages;
                if (!Array.isArray(language)) {
                    languages = [ language ];
                } else {
                    languages = language;
                }
                var resolvedLanguages = [];
                for (var l = 0; l < languages.length; l++) {
                    resolvedLanguages.push(languages[l]);
                    if (typeof languages[l] === "string" && languages[l].indexOf("-") > 0) {
                        var languageParts = languages[l].split("-");
                        var baseLanguage = languageParts[0];
                        resolvedLanguages.push(baseLanguage);
                    }
                }
                return resolvedLanguages;
            };
            Defaults.prototype._processTranslations = function(languages, debug) {
                var translations = new Translation();
                for (var l = 0; l < languages.length; l++) {
                    var languageData = new Translation();
                    var language = languages[l];
                    if (typeof language === "string") {
                        try {
                            languageData = Translation.loadPath(language);
                        } catch (e) {
                            try {
                                language = this.defaults.amdLanguageBase + language;
                                languageData = Translation.loadPath(language);
                            } catch (ex) {
                                if (debug && window.console && console.warn) {
                                    console.warn('Select2: The language file for "' + language + '" could ' + "not be automatically loaded. A fallback will be used instead.");
                                }
                            }
                        }
                    } else if ($.isPlainObject(language)) {
                        languageData = new Translation(language);
                    } else {
                        languageData = language;
                    }
                    translations.extend(languageData);
                }
                return translations;
            };
            Defaults.prototype.set = function(key, value) {
                var camelKey = $.camelCase(key);
                var data = {};
                data[camelKey] = value;
                var convertedData = Utils._convertData(data);
                $.extend(true, this.defaults, convertedData);
            };
            var defaults = new Defaults();
            return defaults;
        });
        S2.define("select2/options", [ "jquery", "./defaults", "./utils" ], function($, Defaults, Utils) {
            function Options(options, $element) {
                this.options = options;
                if ($element != null) {
                    this.fromElement($element);
                }
                if ($element != null) {
                    this.options = Defaults.applyFromElement(this.options, $element);
                }
                this.options = Defaults.apply(this.options);
            }
            Options.prototype.fromElement = function($e) {
                var excludedData = [ "select2" ];
                if (this.options.multiple == null) {
                    this.options.multiple = $e.prop("multiple");
                }
                if (this.options.disabled == null) {
                    this.options.disabled = $e.prop("disabled");
                }
                if (this.options.autocomplete == null && $e.prop("autocomplete")) {
                    this.options.autocomplete = $e.prop("autocomplete");
                }
                if (this.options.dir == null) {
                    if ($e.prop("dir")) {
                        this.options.dir = $e.prop("dir");
                    } else if ($e.closest("[dir]").prop("dir")) {
                        this.options.dir = $e.closest("[dir]").prop("dir");
                    } else {
                        this.options.dir = "ltr";
                    }
                }
                $e.prop("disabled", this.options.disabled);
                $e.prop("multiple", this.options.multiple);
                if (Utils.GetData($e[0], "select2Tags")) {
                    if (this.options.debug && window.console && console.warn) {
                        console.warn("Select2: The `data-select2-tags` attribute has been changed to " + 'use the `data-data` and `data-tags="true"` attributes and will be ' + "removed in future versions of Select2.");
                    }
                    Utils.StoreData($e[0], "data", Utils.GetData($e[0], "select2Tags"));
                    Utils.StoreData($e[0], "tags", true);
                }
                if (Utils.GetData($e[0], "ajaxUrl")) {
                    if (this.options.debug && window.console && console.warn) {
                        console.warn("Select2: The `data-ajax-url` attribute has been changed to " + "`data-ajax--url` and support for the old attribute will be removed" + " in future versions of Select2.");
                    }
                    $e.attr("ajax--url", Utils.GetData($e[0], "ajaxUrl"));
                    Utils.StoreData($e[0], "ajax-Url", Utils.GetData($e[0], "ajaxUrl"));
                }
                var dataset = {};
                function upperCaseLetter(_, letter) {
                    return letter.toUpperCase();
                }
                for (var attr = 0; attr < $e[0].attributes.length; attr++) {
                    var attributeName = $e[0].attributes[attr].name;
                    var prefix = "data-";
                    if (attributeName.substr(0, prefix.length) == prefix) {
                        var dataName = attributeName.substring(prefix.length);
                        var dataValue = Utils.GetData($e[0], dataName);
                        var camelDataName = dataName.replace(/-([a-z])/g, upperCaseLetter);
                        dataset[camelDataName] = dataValue;
                    }
                }
                if ($.fn.jquery && $.fn.jquery.substr(0, 2) == "1." && $e[0].dataset) {
                    dataset = $.extend(true, {}, $e[0].dataset, dataset);
                }
                var data = $.extend(true, {}, Utils.GetData($e[0]), dataset);
                data = Utils._convertData(data);
                for (var key in data) {
                    if (excludedData.indexOf(key) > -1) {
                        continue;
                    }
                    if ($.isPlainObject(this.options[key])) {
                        $.extend(this.options[key], data[key]);
                    } else {
                        this.options[key] = data[key];
                    }
                }
                return this;
            };
            Options.prototype.get = function(key) {
                return this.options[key];
            };
            Options.prototype.set = function(key, val) {
                this.options[key] = val;
            };
            return Options;
        });
        S2.define("select2/core", [ "jquery", "./options", "./utils", "./keys" ], function($, Options, Utils, KEYS) {
            var Select2 = function($element, options) {
                if (Utils.GetData($element[0], "select2") != null) {
                    Utils.GetData($element[0], "select2").destroy();
                }
                this.$element = $element;
                this.id = this._generateId($element);
                options = options || {};
                this.options = new Options(options, $element);
                Select2.__super__.constructor.call(this);
                var tabindex = $element.attr("tabindex") || 0;
                Utils.StoreData($element[0], "old-tabindex", tabindex);
                $element.attr("tabindex", "-1");
                var DataAdapter = this.options.get("dataAdapter");
                this.dataAdapter = new DataAdapter($element, this.options);
                var $container = this.render();
                this._placeContainer($container);
                var SelectionAdapter = this.options.get("selectionAdapter");
                this.selection = new SelectionAdapter($element, this.options);
                this.$selection = this.selection.render();
                this.selection.position(this.$selection, $container);
                var DropdownAdapter = this.options.get("dropdownAdapter");
                this.dropdown = new DropdownAdapter($element, this.options);
                this.$dropdown = this.dropdown.render();
                this.dropdown.position(this.$dropdown, $container);
                var ResultsAdapter = this.options.get("resultsAdapter");
                this.results = new ResultsAdapter($element, this.options, this.dataAdapter);
                this.$results = this.results.render();
                this.results.position(this.$results, this.$dropdown);
                var self = this;
                this._bindAdapters();
                this._registerDomEvents();
                this._registerDataEvents();
                this._registerSelectionEvents();
                this._registerDropdownEvents();
                this._registerResultsEvents();
                this._registerEvents();
                this.dataAdapter.current(function(initialData) {
                    self.trigger("selection:update", {
                        data: initialData
                    });
                });
                $element[0].classList.add("select2-hidden-accessible");
                $element.attr("aria-hidden", "true");
                this._syncAttributes();
                Utils.StoreData($element[0], "select2", this);
                $element.data("select2", this);
            };
            Utils.Extend(Select2, Utils.Observable);
            Select2.prototype._generateId = function($element) {
                var id = "";
                if ($element.attr("id") != null) {
                    id = $element.attr("id");
                } else if ($element.attr("name") != null) {
                    id = $element.attr("name") + "-" + Utils.generateChars(2);
                } else {
                    id = Utils.generateChars(4);
                }
                id = id.replace(/(:|\.|\[|\]|,)/g, "");
                id = "select2-" + id;
                return id;
            };
            Select2.prototype._placeContainer = function($container) {
                $container.insertAfter(this.$element);
                var width = this._resolveWidth(this.$element, this.options.get("width"));
                if (width != null) {
                    $container.css("width", width);
                }
            };
            Select2.prototype._resolveWidth = function($element, method) {
                var WIDTH = /^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i;
                if (method == "resolve") {
                    var styleWidth = this._resolveWidth($element, "style");
                    if (styleWidth != null) {
                        return styleWidth;
                    }
                    return this._resolveWidth($element, "element");
                }
                if (method == "element") {
                    var elementWidth = $element.outerWidth(false);
                    if (elementWidth <= 0) {
                        return "auto";
                    }
                    return elementWidth + "px";
                }
                if (method == "style") {
                    var style = $element.attr("style");
                    if (typeof style !== "string") {
                        return null;
                    }
                    var attrs = style.split(";");
                    for (var i = 0, l = attrs.length; i < l; i = i + 1) {
                        var attr = attrs[i].replace(/\s/g, "");
                        var matches = attr.match(WIDTH);
                        if (matches !== null && matches.length >= 1) {
                            return matches[1];
                        }
                    }
                    return null;
                }
                if (method == "computedstyle") {
                    var computedStyle = window.getComputedStyle($element[0]);
                    return computedStyle.width;
                }
                return method;
            };
            Select2.prototype._bindAdapters = function() {
                this.dataAdapter.bind(this, this.$container);
                this.selection.bind(this, this.$container);
                this.dropdown.bind(this, this.$container);
                this.results.bind(this, this.$container);
            };
            Select2.prototype._registerDomEvents = function() {
                var self = this;
                this.$element.on("change.select2", function() {
                    self.dataAdapter.current(function(data) {
                        self.trigger("selection:update", {
                            data: data
                        });
                    });
                });
                this.$element.on("focus.select2", function(evt) {
                    self.trigger("focus", evt);
                });
                this._syncA = Utils.bind(this._syncAttributes, this);
                this._syncS = Utils.bind(this._syncSubtree, this);
                this._observer = new window.MutationObserver(function(mutations) {
                    self._syncA();
                    self._syncS(mutations);
                });
                this._observer.observe(this.$element[0], {
                    attributes: true,
                    childList: true,
                    subtree: false
                });
            };
            Select2.prototype._registerDataEvents = function() {
                var self = this;
                this.dataAdapter.on("*", function(name, params) {
                    self.trigger(name, params);
                });
            };
            Select2.prototype._registerSelectionEvents = function() {
                var self = this;
                var nonRelayEvents = [ "toggle", "focus" ];
                this.selection.on("toggle", function() {
                    self.toggleDropdown();
                });
                this.selection.on("focus", function(params) {
                    self.focus(params);
                });
                this.selection.on("*", function(name, params) {
                    if (nonRelayEvents.indexOf(name) !== -1) {
                        return;
                    }
                    self.trigger(name, params);
                });
            };
            Select2.prototype._registerDropdownEvents = function() {
                var self = this;
                this.dropdown.on("*", function(name, params) {
                    self.trigger(name, params);
                });
            };
            Select2.prototype._registerResultsEvents = function() {
                var self = this;
                this.results.on("*", function(name, params) {
                    self.trigger(name, params);
                });
            };
            Select2.prototype._registerEvents = function() {
                var self = this;
                this.on("open", function() {
                    self.$container[0].classList.add("select2-container--open");
                });
                this.on("close", function() {
                    self.$container[0].classList.remove("select2-container--open");
                });
                this.on("enable", function() {
                    self.$container[0].classList.remove("select2-container--disabled");
                });
                this.on("disable", function() {
                    self.$container[0].classList.add("select2-container--disabled");
                });
                this.on("blur", function() {
                    self.$container[0].classList.remove("select2-container--focus");
                });
                this.on("query", function(params) {
                    if (!self.isOpen()) {
                        self.trigger("open", {});
                    }
                    this.dataAdapter.query(params, function(data) {
                        self.trigger("results:all", {
                            data: data,
                            query: params
                        });
                    });
                });
                this.on("query:append", function(params) {
                    this.dataAdapter.query(params, function(data) {
                        self.trigger("results:append", {
                            data: data,
                            query: params
                        });
                    });
                });
                this.on("keypress", function(evt) {
                    var key = evt.which;
                    if (self.isOpen()) {
                        if (key === KEYS.ESC || key === KEYS.UP && evt.altKey) {
                            self.close(evt);
                            evt.preventDefault();
                        } else if (key === KEYS.ENTER || key === KEYS.TAB) {
                            self.trigger("results:select", {});
                            evt.preventDefault();
                        } else if (key === KEYS.SPACE && evt.ctrlKey) {
                            self.trigger("results:toggle", {});
                            evt.preventDefault();
                        } else if (key === KEYS.UP) {
                            self.trigger("results:previous", {});
                            evt.preventDefault();
                        } else if (key === KEYS.DOWN) {
                            self.trigger("results:next", {});
                            evt.preventDefault();
                        }
                    } else {
                        if (key === KEYS.ENTER || key === KEYS.SPACE || key === KEYS.DOWN && evt.altKey) {
                            self.open();
                            evt.preventDefault();
                        }
                    }
                });
            };
            Select2.prototype._syncAttributes = function() {
                this.options.set("disabled", this.$element.prop("disabled"));
                if (this.isDisabled()) {
                    if (this.isOpen()) {
                        this.close();
                    }
                    this.trigger("disable", {});
                } else {
                    this.trigger("enable", {});
                }
            };
            Select2.prototype._isChangeMutation = function(mutations) {
                var self = this;
                if (mutations.addedNodes && mutations.addedNodes.length > 0) {
                    for (var n = 0; n < mutations.addedNodes.length; n++) {
                        var node = mutations.addedNodes[n];
                        if (node.selected) {
                            return true;
                        }
                    }
                } else if (mutations.removedNodes && mutations.removedNodes.length > 0) {
                    return true;
                } else if (Array.isArray(mutations)) {
                    return mutations.some(function(mutation) {
                        return self._isChangeMutation(mutation);
                    });
                }
                return false;
            };
            Select2.prototype._syncSubtree = function(mutations) {
                var changed = this._isChangeMutation(mutations);
                var self = this;
                if (changed) {
                    this.dataAdapter.current(function(currentData) {
                        self.trigger("selection:update", {
                            data: currentData
                        });
                    });
                }
            };
            Select2.prototype.trigger = function(name, args) {
                var actualTrigger = Select2.__super__.trigger;
                var preTriggerMap = {
                    open: "opening",
                    close: "closing",
                    select: "selecting",
                    unselect: "unselecting",
                    clear: "clearing"
                };
                if (args === undefined) {
                    args = {};
                }
                if (name in preTriggerMap) {
                    var preTriggerName = preTriggerMap[name];
                    var preTriggerArgs = {
                        prevented: false,
                        name: name,
                        args: args
                    };
                    actualTrigger.call(this, preTriggerName, preTriggerArgs);
                    if (preTriggerArgs.prevented) {
                        args.prevented = true;
                        return;
                    }
                }
                actualTrigger.call(this, name, args);
            };
            Select2.prototype.toggleDropdown = function() {
                if (this.isDisabled()) {
                    return;
                }
                if (this.isOpen()) {
                    this.close();
                } else {
                    this.open();
                }
            };
            Select2.prototype.open = function() {
                if (this.isOpen()) {
                    return;
                }
                if (this.isDisabled()) {
                    return;
                }
                this.trigger("query", {});
            };
            Select2.prototype.close = function(evt) {
                if (!this.isOpen()) {
                    return;
                }
                this.trigger("close", {
                    originalEvent: evt
                });
            };
            Select2.prototype.isEnabled = function() {
                return !this.isDisabled();
            };
            Select2.prototype.isDisabled = function() {
                return this.options.get("disabled");
            };
            Select2.prototype.isOpen = function() {
                return this.$container[0].classList.contains("select2-container--open");
            };
            Select2.prototype.hasFocus = function() {
                return this.$container[0].classList.contains("select2-container--focus");
            };
            Select2.prototype.focus = function(data) {
                if (this.hasFocus()) {
                    return;
                }
                this.$container[0].classList.add("select2-container--focus");
                this.trigger("focus", {});
            };
            Select2.prototype.enable = function(args) {
                if (this.options.get("debug") && window.console && console.warn) {
                    console.warn('Select2: The `select2("enable")` method has been deprecated and will' + ' be removed in later Select2 versions. Use $element.prop("disabled")' + " instead.");
                }
                if (args == null || args.length === 0) {
                    args = [ true ];
                }
                var disabled = !args[0];
                this.$element.prop("disabled", disabled);
            };
            Select2.prototype.data = function() {
                if (this.options.get("debug") && arguments.length > 0 && window.console && console.warn) {
                    console.warn('Select2: Data can no longer be set using `select2("data")`. You ' + "should consider setting the value instead using `$element.val()`.");
                }
                var data = [];
                this.dataAdapter.current(function(currentData) {
                    data = currentData;
                });
                return data;
            };
            Select2.prototype.val = function(args) {
                if (this.options.get("debug") && window.console && console.warn) {
                    console.warn('Select2: The `select2("val")` method has been deprecated and will be' + " removed in later Select2 versions. Use $element.val() instead.");
                }
                if (args == null || args.length === 0) {
                    return this.$element.val();
                }
                var newVal = args[0];
                if (Array.isArray(newVal)) {
                    newVal = newVal.map(function(obj) {
                        return obj.toString();
                    });
                }
                this.$element.val(newVal).trigger("input").trigger("change");
            };
            Select2.prototype.destroy = function() {
                Utils.RemoveData(this.$container[0]);
                this.$container.remove();
                this._observer.disconnect();
                this._observer = null;
                this._syncA = null;
                this._syncS = null;
                this.$element.off(".select2");
                this.$element.attr("tabindex", Utils.GetData(this.$element[0], "old-tabindex"));
                this.$element[0].classList.remove("select2-hidden-accessible");
                this.$element.attr("aria-hidden", "false");
                Utils.RemoveData(this.$element[0]);
                this.$element.removeData("select2");
                this.dataAdapter.destroy();
                this.selection.destroy();
                this.dropdown.destroy();
                this.results.destroy();
                this.dataAdapter = null;
                this.selection = null;
                this.dropdown = null;
                this.results = null;
            };
            Select2.prototype.render = function() {
                var $container = $('<span class="select2 select2-container">' + '<span class="selection"></span>' + '<span class="dropdown-wrapper" aria-hidden="true"></span>' + "</span>");
                $container.attr("dir", this.options.get("dir"));
                this.$container = $container;
                this.$container[0].classList.add("select2-container--" + this.options.get("theme"));
                Utils.StoreData($container[0], "element", this.$element);
                return $container;
            };
            return Select2;
        });
        S2.define("jquery-mousewheel", [ "jquery" ], function($) {
            return $;
        });
        S2.define("jquery.select2", [ "jquery", "jquery-mousewheel", "./select2/core", "./select2/defaults", "./select2/utils" ], function($, _, Select2, Defaults, Utils) {
            if ($.fn.select2 == null) {
                var thisMethods = [ "open", "close", "destroy" ];
                $.fn.select2 = function(options) {
                    options = options || {};
                    if (typeof options === "object") {
                        this.each(function() {
                            var instanceOptions = $.extend(true, {}, options);
                            var instance = new Select2($(this), instanceOptions);
                        });
                        return this;
                    } else if (typeof options === "string") {
                        var ret;
                        var args = Array.prototype.slice.call(arguments, 1);
                        this.each(function() {
                            var instance = Utils.GetData(this, "select2");
                            if (instance == null && window.console && console.error) {
                                console.error("The select2('" + options + "') method was called on an " + "element that is not using Select2.");
                            }
                            ret = instance[options].apply(instance, args);
                        });
                        if (thisMethods.indexOf(options) > -1) {
                            return this;
                        }
                        return ret;
                    } else {
                        throw new Error("Invalid arguments for Select2: " + options);
                    }
                };
            }
            if ($.fn.select2.defaults == null) {
                $.fn.select2.defaults = Defaults;
            }
            return Select2;
        });
        return {
            define: S2.define,
            require: S2.require
        };
    }();
    var select2 = S2.require("jquery.select2");
    jQuery.fn.select2.amd = S2;
    return select2;
});

(function(factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define([ "./blueimp-helper" ], factory);
    } else {
        window.blueimp = window.blueimp || {};
        window.blueimp.Gallery = factory(window.blueimp.helper || window.jQuery);
    }
})(function($) {
    "use strict";
    function Gallery(list, options) {
        if (document.body.style.maxHeight === undefined) {
            return null;
        }
        if (!this || this.options !== Gallery.prototype.options) {
            return new Gallery(list, options);
        }
        if (!list || !list.length) {
            this.console.log("blueimp Gallery: No or empty list provided as first argument.", list);
            return;
        }
        this.list = list;
        this.num = list.length;
        this.initOptions(options);
        this.initialize();
    }
    $.extend(Gallery.prototype, {
        options: {
            container: "#blueimp-gallery",
            slidesContainer: "div",
            titleElement: "h3",
            displayClass: "blueimp-gallery-display",
            controlsClass: "blueimp-gallery-controls",
            singleClass: "blueimp-gallery-single",
            leftEdgeClass: "blueimp-gallery-left",
            rightEdgeClass: "blueimp-gallery-right",
            playingClass: "blueimp-gallery-playing",
            svgasimgClass: "blueimp-gallery-svgasimg",
            smilClass: "blueimp-gallery-smil",
            slideClass: "slide",
            slideActiveClass: "slide-active",
            slidePrevClass: "slide-prev",
            slideNextClass: "slide-next",
            slideLoadingClass: "slide-loading",
            slideErrorClass: "slide-error",
            slideContentClass: "slide-content",
            toggleClass: "toggle",
            prevClass: "prev",
            nextClass: "next",
            closeClass: "btn-close",
            playPauseClass: "play-pause",
            typeProperty: "type",
            titleProperty: "title",
            altTextProperty: "alt",
            urlProperty: "href",
            srcsetProperty: "srcset",
            sizesProperty: "sizes",
            sourcesProperty: "sources",
            displayTransition: true,
            clearSlides: true,
            toggleControlsOnEnter: true,
            toggleControlsOnSlideClick: true,
            toggleSlideshowOnSpace: true,
            enableKeyboardNavigation: true,
            closeOnEscape: true,
            closeOnSlideClick: true,
            closeOnSwipeUpOrDown: true,
            closeOnHashChange: true,
            emulateTouchEvents: true,
            stopTouchEventsPropagation: false,
            hidePageScrollbars: true,
            disableScroll: true,
            carousel: false,
            continuous: true,
            unloadElements: true,
            startSlideshow: false,
            slideshowInterval: 5e3,
            slideshowDirection: "ltr",
            index: 0,
            preloadRange: 2,
            transitionDuration: 300,
            slideshowTransitionDuration: 500,
            event: undefined,
            onopen: undefined,
            onopened: undefined,
            onslide: undefined,
            onslideend: undefined,
            onslidecomplete: undefined,
            onclose: undefined,
            onclosed: undefined
        },
        carouselOptions: {
            hidePageScrollbars: false,
            toggleControlsOnEnter: false,
            toggleSlideshowOnSpace: false,
            enableKeyboardNavigation: false,
            closeOnEscape: false,
            closeOnSlideClick: false,
            closeOnSwipeUpOrDown: false,
            closeOnHashChange: false,
            disableScroll: false,
            startSlideshow: true
        },
        console: window.console && typeof window.console.log === "function" ? window.console : {
            log: function() {}
        },
        support: function(element) {
            var support = {
                source: !!window.HTMLSourceElement,
                picture: !!window.HTMLPictureElement,
                svgasimg: document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1"),
                smil: !!document.createElementNS && /SVGAnimate/.test(document.createElementNS("http://www.w3.org/2000/svg", "animate").toString()),
                touch: window.ontouchstart !== undefined || window.DocumentTouch && document instanceof DocumentTouch
            };
            var transitions = {
                webkitTransition: {
                    end: "webkitTransitionEnd",
                    prefix: "-webkit-"
                },
                MozTransition: {
                    end: "transitionend",
                    prefix: "-moz-"
                },
                OTransition: {
                    end: "otransitionend",
                    prefix: "-o-"
                },
                transition: {
                    end: "transitionend",
                    prefix: ""
                }
            };
            var prop;
            for (prop in transitions) {
                if (Object.prototype.hasOwnProperty.call(transitions, prop) && element.style[prop] !== undefined) {
                    support.transition = transitions[prop];
                    support.transition.name = prop;
                    break;
                }
            }
            function elementTests() {
                var transition = support.transition;
                var prop;
                var translateZ;
                document.body.appendChild(element);
                if (transition) {
                    prop = transition.name.slice(0, -9) + "ransform";
                    if (element.style[prop] !== undefined) {
                        element.style[prop] = "translateZ(0)";
                        translateZ = window.getComputedStyle(element).getPropertyValue(transition.prefix + "transform");
                        support.transform = {
                            prefix: transition.prefix,
                            name: prop,
                            translate: true,
                            translateZ: !!translateZ && translateZ !== "none"
                        };
                    }
                }
                document.body.removeChild(element);
            }
            if (document.body) {
                elementTests();
            } else {
                $(document).on("DOMContentLoaded", elementTests);
            }
            return support;
        }(document.createElement("div")),
        requestAnimationFrame: window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame,
        cancelAnimationFrame: window.cancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame,
        initialize: function() {
            this.initStartIndex();
            if (this.initWidget() === false) {
                return false;
            }
            this.initEventListeners();
            this.onslide(this.index);
            this.ontransitionend();
            if (this.options.startSlideshow) {
                this.play();
            }
        },
        slide: function(to, duration) {
            window.clearTimeout(this.timeout);
            var index = this.index;
            var direction;
            var naturalDirection;
            var diff;
            if (index === to || this.num === 1) {
                return;
            }
            if (!duration) {
                duration = this.options.transitionDuration;
            }
            if (this.support.transform) {
                if (!this.options.continuous) {
                    to = this.circle(to);
                }
                direction = Math.abs(index - to) / (index - to);
                if (this.options.continuous) {
                    naturalDirection = direction;
                    direction = -this.positions[this.circle(to)] / this.slideWidth;
                    if (direction !== naturalDirection) {
                        to = -direction * this.num + to;
                    }
                }
                diff = Math.abs(index - to) - 1;
                while (diff) {
                    diff -= 1;
                    this.move(this.circle((to > index ? to : index) - diff - 1), this.slideWidth * direction, 0);
                }
                to = this.circle(to);
                this.move(index, this.slideWidth * direction, duration);
                this.move(to, 0, duration);
                if (this.options.continuous) {
                    this.move(this.circle(to - direction), -(this.slideWidth * direction), 0);
                }
            } else {
                to = this.circle(to);
                this.animate(index * -this.slideWidth, to * -this.slideWidth, duration);
            }
            this.onslide(to);
        },
        getIndex: function() {
            return this.index;
        },
        getNumber: function() {
            return this.num;
        },
        prev: function() {
            if (this.options.continuous || this.index) {
                this.slide(this.index - 1);
            }
        },
        next: function() {
            if (this.options.continuous || this.index < this.num - 1) {
                this.slide(this.index + 1);
            }
        },
        play: function(time) {
            var that = this;
            var nextIndex = this.index + (this.options.slideshowDirection === "rtl" ? -1 : 1);
            window.clearTimeout(this.timeout);
            this.interval = time || this.options.slideshowInterval;
            if (this.elements[this.index] > 1) {
                this.timeout = this.setTimeout(!this.requestAnimationFrame && this.slide || function(to, duration) {
                    that.animationFrameId = that.requestAnimationFrame.call(window, function() {
                        that.slide(to, duration);
                    });
                }, [ nextIndex, this.options.slideshowTransitionDuration ], this.interval);
            }
            this.container.addClass(this.options.playingClass);
            this.slidesContainer[0].setAttribute("aria-live", "off");
            if (this.playPauseElement.length) {
                this.playPauseElement[0].setAttribute("aria-pressed", "true");
            }
        },
        pause: function() {
            window.clearTimeout(this.timeout);
            this.interval = null;
            if (this.cancelAnimationFrame) {
                this.cancelAnimationFrame.call(window, this.animationFrameId);
                this.animationFrameId = null;
            }
            this.container.removeClass(this.options.playingClass);
            this.slidesContainer[0].setAttribute("aria-live", "polite");
            if (this.playPauseElement.length) {
                this.playPauseElement[0].setAttribute("aria-pressed", "false");
            }
        },
        add: function(list) {
            var i;
            if (!list.concat) {
                list = Array.prototype.slice.call(list);
            }
            if (!this.list.concat) {
                this.list = Array.prototype.slice.call(this.list);
            }
            this.list = this.list.concat(list);
            this.num = this.list.length;
            if (this.num > 2 && this.options.continuous === null) {
                this.options.continuous = true;
                this.container.removeClass(this.options.leftEdgeClass);
            }
            this.container.removeClass(this.options.rightEdgeClass).removeClass(this.options.singleClass);
            for (i = this.num - list.length; i < this.num; i += 1) {
                this.addSlide(i);
                this.positionSlide(i);
            }
            this.positions.length = this.num;
            this.initSlides(true);
        },
        resetSlides: function() {
            this.slidesContainer.empty();
            this.unloadAllSlides();
            this.slides = [];
        },
        handleClose: function() {
            var options = this.options;
            this.destroyEventListeners();
            this.pause();
            this.container[0].style.display = "none";
            this.container.removeClass(options.displayClass).removeClass(options.singleClass).removeClass(options.leftEdgeClass).removeClass(options.rightEdgeClass);
            if (options.hidePageScrollbars) {
                document.body.style.overflow = this.bodyOverflowStyle;
            }
            if (this.options.clearSlides) {
                this.resetSlides();
            }
            if (this.options.onclosed) {
                this.options.onclosed.call(this);
            }
        },
        close: function() {
            var that = this;
            function closeHandler(event) {
                if (event.target === that.container[0]) {
                    that.container.off(that.support.transition.end, closeHandler);
                    that.handleClose();
                }
            }
            if (this.options.onclose) {
                this.options.onclose.call(this);
            }
            if (this.support.transition && this.options.displayTransition) {
                this.container.on(this.support.transition.end, closeHandler);
                this.container.removeClass(this.options.displayClass);
            } else {
                this.handleClose();
            }
        },
        circle: function(index) {
            return (this.num + index % this.num) % this.num;
        },
        move: function(index, dist, duration) {
            this.translateX(index, dist, duration);
            this.positions[index] = dist;
        },
        translate: function(index, x, y, duration) {
            if (!this.slides[index]) return;
            var style = this.slides[index].style;
            var transition = this.support.transition;
            var transform = this.support.transform;
            style[transition.name + "Duration"] = duration + "ms";
            style[transform.name] = "translate(" + x + "px, " + y + "px)" + (transform.translateZ ? " translateZ(0)" : "");
        },
        translateX: function(index, x, duration) {
            this.translate(index, x, 0, duration);
        },
        translateY: function(index, y, duration) {
            this.translate(index, 0, y, duration);
        },
        animate: function(from, to, duration) {
            if (!duration) {
                this.slidesContainer[0].style.left = to + "px";
                return;
            }
            var that = this;
            var start = new Date().getTime();
            var timer = window.setInterval(function() {
                var timeElap = new Date().getTime() - start;
                if (timeElap > duration) {
                    that.slidesContainer[0].style.left = to + "px";
                    that.ontransitionend();
                    window.clearInterval(timer);
                    return;
                }
                that.slidesContainer[0].style.left = (to - from) * (Math.floor(timeElap / duration * 100) / 100) + from + "px";
            }, 4);
        },
        preventDefault: function(event) {
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        },
        stopPropagation: function(event) {
            if (event.stopPropagation) {
                event.stopPropagation();
            } else {
                event.cancelBubble = true;
            }
        },
        onresize: function() {
            this.initSlides(true);
        },
        onhashchange: function() {
            if (this.options.closeOnHashChange) {
                this.close();
            }
        },
        onmousedown: function(event) {
            if (event.which && event.which === 1 && event.target.nodeName !== "VIDEO" && event.target.nodeName !== "AUDIO") {
                event.preventDefault();
                (event.originalEvent || event).touches = [ {
                    pageX: event.pageX,
                    pageY: event.pageY
                } ];
                this.ontouchstart(event);
            }
        },
        onmousemove: function(event) {
            if (this.touchStart) {
                (event.originalEvent || event).touches = [ {
                    pageX: event.pageX,
                    pageY: event.pageY
                } ];
                this.ontouchmove(event);
            }
        },
        onmouseup: function(event) {
            if (this.touchStart) {
                this.ontouchend(event);
                delete this.touchStart;
            }
        },
        onmouseout: function(event) {
            if (this.touchStart) {
                var target = event.target;
                var related = event.relatedTarget;
                if (!related || related !== target && !$.contains(target, related)) {
                    this.onmouseup(event);
                }
            }
        },
        ontouchstart: function(event) {
            if (this.options.stopTouchEventsPropagation) {
                this.stopPropagation(event);
            }
            var touch = (event.originalEvent || event).touches[0];
            this.touchStart = {
                x: touch.pageX,
                y: touch.pageY,
                time: Date.now()
            };
            this.isScrolling = undefined;
            this.touchDelta = {};
        },
        ontouchmove: function(event) {
            if (this.options.stopTouchEventsPropagation) {
                this.stopPropagation(event);
            }
            var touches = (event.originalEvent || event).touches;
            var touch = touches[0];
            var scale = (event.originalEvent || event).scale;
            var index = this.index;
            var touchDeltaX;
            var indices;
            if (touches.length > 1 || scale && scale !== 1) {
                return;
            }
            if (this.options.disableScroll) {
                event.preventDefault();
            }
            this.touchDelta = {
                x: touch.pageX - this.touchStart.x,
                y: touch.pageY - this.touchStart.y
            };
            touchDeltaX = this.touchDelta.x;
            if (this.isScrolling === undefined) {
                this.isScrolling = this.isScrolling || Math.abs(touchDeltaX) < Math.abs(this.touchDelta.y);
            }
            if (!this.isScrolling) {
                event.preventDefault();
                window.clearTimeout(this.timeout);
                if (this.options.continuous) {
                    indices = [ this.circle(index + 1), index, this.circle(index - 1) ];
                } else {
                    this.touchDelta.x = touchDeltaX = touchDeltaX / (!index && touchDeltaX > 0 || index === this.num - 1 && touchDeltaX < 0 ? Math.abs(touchDeltaX) / this.slideWidth + 1 : 1);
                    indices = [ index ];
                    if (index) {
                        indices.push(index - 1);
                    }
                    if (index < this.num - 1) {
                        indices.unshift(index + 1);
                    }
                }
                while (indices.length) {
                    index = indices.pop();
                    this.translateX(index, touchDeltaX + this.positions[index], 0);
                }
            } else if (!this.options.carousel) {
                this.translateY(index, this.touchDelta.y + this.positions[index], 0);
            }
        },
        ontouchend: function(event) {
            if (this.options.stopTouchEventsPropagation) {
                this.stopPropagation(event);
            }
            var index = this.index;
            var absTouchDeltaX = Math.abs(this.touchDelta.x);
            var slideWidth = this.slideWidth;
            var duration = Math.ceil(this.options.transitionDuration * (1 - absTouchDeltaX / slideWidth) / 2);
            var isValidSlide = absTouchDeltaX > 20;
            var isPastBounds = !index && this.touchDelta.x > 0 || index === this.num - 1 && this.touchDelta.x < 0;
            var isValidClose = !isValidSlide && this.options.closeOnSwipeUpOrDown && Math.abs(this.touchDelta.y) > 20;
            var direction;
            var indexForward;
            var indexBackward;
            var distanceForward;
            var distanceBackward;
            if (this.options.continuous) {
                isPastBounds = false;
            }
            direction = this.touchDelta.x < 0 ? -1 : 1;
            if (!this.isScrolling) {
                if (isValidSlide && !isPastBounds) {
                    indexForward = index + direction;
                    indexBackward = index - direction;
                    distanceForward = slideWidth * direction;
                    distanceBackward = -slideWidth * direction;
                    if (this.options.continuous) {
                        this.move(this.circle(indexForward), distanceForward, 0);
                        this.move(this.circle(index - 2 * direction), distanceBackward, 0);
                    } else if (indexForward >= 0 && indexForward < this.num) {
                        this.move(indexForward, distanceForward, 0);
                    }
                    this.move(index, this.positions[index] + distanceForward, duration);
                    this.move(this.circle(indexBackward), this.positions[this.circle(indexBackward)] + distanceForward, duration);
                    index = this.circle(indexBackward);
                    this.onslide(index);
                } else {
                    if (this.options.continuous) {
                        this.move(this.circle(index - 1), -slideWidth, duration);
                        this.move(index, 0, duration);
                        this.move(this.circle(index + 1), slideWidth, duration);
                    } else {
                        if (index) {
                            this.move(index - 1, -slideWidth, duration);
                        }
                        this.move(index, 0, duration);
                        if (index < this.num - 1) {
                            this.move(index + 1, slideWidth, duration);
                        }
                    }
                }
            } else {
                if (isValidClose) {
                    this.close();
                } else {
                    this.translateY(index, 0, duration);
                }
            }
        },
        ontouchcancel: function(event) {
            if (this.touchStart) {
                this.ontouchend(event);
                delete this.touchStart;
            }
        },
        ontransitionend: function(event) {
            var slide = this.slides[this.index];
            if (!event || slide === event.target) {
                if (this.interval) {
                    this.play();
                }
                this.setTimeout(this.options.onslideend, [ this.index, slide ]);
            }
        },
        oncomplete: function(event) {
            var target = event.target || event.srcElement;
            var parent = target && target.parentNode;
            var index;
            if (!target || !parent) {
                return;
            }
            index = this.getNodeIndex(parent);
            $(parent).removeClass(this.options.slideLoadingClass);
            if (event.type === "error") {
                $(parent).addClass(this.options.slideErrorClass);
                this.elements[index] = 3;
            } else {
                this.elements[index] = 2;
            }
            if (target.clientHeight > this.container[0].clientHeight) {
                target.style.maxHeight = this.container[0].clientHeight;
            }
            if (this.interval && this.slides[this.index] === parent) {
                this.play();
            }
            this.setTimeout(this.options.onslidecomplete, [ index, parent ]);
        },
        onload: function(event) {
            this.oncomplete(event);
        },
        onerror: function(event) {
            this.oncomplete(event);
        },
        onkeydown: function(event) {
            switch (event.which || event.keyCode) {
              case 13:
                if (this.options.toggleControlsOnEnter) {
                    this.preventDefault(event);
                    this.toggleControls();
                }
                break;

              case 27:
                if (this.options.closeOnEscape) {
                    this.close();
                    event.stopImmediatePropagation();
                }
                break;

              case 32:
                if (this.options.toggleSlideshowOnSpace) {
                    this.preventDefault(event);
                    this.toggleSlideshow();
                }
                break;

              case 37:
                if (this.options.enableKeyboardNavigation) {
                    this.preventDefault(event);
                    this.prev();
                }
                break;

              case 39:
                if (this.options.enableKeyboardNavigation) {
                    this.preventDefault(event);
                    this.next();
                }
                break;
            }
        },
        handleClick: function(event) {
            var options = this.options;
            var target = event.target || event.srcElement;
            var parent = target.parentNode;
            function isTarget(className) {
                return $(target).hasClass(className) || $(parent).hasClass(className);
            }
            if (isTarget(options.toggleClass)) {
                this.preventDefault(event);
                this.toggleControls();
            } else if (isTarget(options.prevClass)) {
                this.preventDefault(event);
                this.prev();
            } else if (isTarget(options.nextClass)) {
                this.preventDefault(event);
                this.next();
            } else if (isTarget(options.closeClass)) {
                this.preventDefault(event);
                this.close();
            } else if (isTarget(options.playPauseClass)) {
                this.preventDefault(event);
                this.toggleSlideshow();
            } else if (parent === this.slidesContainer[0]) {
                if (options.closeOnSlideClick) {
                    this.preventDefault(event);
                    this.close();
                } else if (options.toggleControlsOnSlideClick) {
                    this.preventDefault(event);
                    this.toggleControls();
                }
            } else if (parent.parentNode && parent.parentNode === this.slidesContainer[0]) {
                if (options.toggleControlsOnSlideClick) {
                    this.preventDefault(event);
                    this.toggleControls();
                }
            }
        },
        onclick: function(event) {
            if (this.options.emulateTouchEvents && this.touchDelta && (Math.abs(this.touchDelta.x) > 20 || Math.abs(this.touchDelta.y) > 20)) {
                delete this.touchDelta;
                return;
            }
            return this.handleClick(event);
        },
        updateEdgeClasses: function(index) {
            if (!index) {
                this.container.addClass(this.options.leftEdgeClass);
            } else {
                this.container.removeClass(this.options.leftEdgeClass);
            }
            if (index === this.num - 1) {
                this.container.addClass(this.options.rightEdgeClass);
            } else {
                this.container.removeClass(this.options.rightEdgeClass);
            }
        },
        updateActiveSlide: function(oldIndex, newIndex) {
            var slides = this.slides;
            var options = this.options;
            var list = [ {
                index: newIndex,
                method: "addClass",
                hidden: false
            }, {
                index: oldIndex,
                method: "removeClass",
                hidden: true
            } ];
            var item, index;
            while (list.length) {
                item = list.pop();
                $(slides[item.index])[item.method](options.slideActiveClass);
                index = this.circle(item.index - 1);
                if (options.continuous || index < item.index) {
                    $(slides[index])[item.method](options.slidePrevClass);
                }
                index = this.circle(item.index + 1);
                if (options.continuous || index > item.index) {
                    $(slides[index])[item.method](options.slideNextClass);
                }
            }
            this.slides[oldIndex].setAttribute("aria-hidden", "true");
            this.slides[newIndex].removeAttribute("aria-hidden");
        },
        handleSlide: function(oldIndex, newIndex) {
            if (!this.options.continuous) {
                this.updateEdgeClasses(newIndex);
            }
            this.updateActiveSlide(oldIndex, newIndex);
            this.loadElements(newIndex);
            if (this.options.unloadElements) {
                this.unloadElements(oldIndex, newIndex);
            }
            this.setTitle(newIndex);
        },
        onslide: function(index) {
            this.handleSlide(this.index, index);
            this.index = index;
            this.setTimeout(this.options.onslide, [ index, this.slides[index] ]);
        },
        setTitle: function(index) {
            var firstChild = this.slides[index].firstChild;
            var text = firstChild.title || firstChild.alt;
            var titleElement = this.titleElement;
            if (titleElement.length) {
                this.titleElement.empty();
                if (text) {
                    titleElement[0].appendChild(document.createTextNode(text));
                }
            }
        },
        setTimeout: function(func, args, wait) {
            var that = this;
            return func && window.setTimeout(function() {
                func.apply(that, args || []);
            }, wait || 0);
        },
        imageFactory: function(obj, callback) {
            var options = this.options;
            var that = this;
            var url = obj;
            var img = this.imagePrototype.cloneNode(false);
            var picture;
            var called;
            var sources;
            var srcset;
            var sizes;
            var title;
            var altText;
            var i;
            function callbackWrapper(event) {
                if (!called) {
                    event = {
                        type: event.type,
                        target: picture || img
                    };
                    if (!event.target.parentNode) {
                        return that.setTimeout(callbackWrapper, [ event ]);
                    }
                    called = true;
                    $(img).off("load error", callbackWrapper);
                    callback(event);
                }
            }
            if (typeof url !== "string") {
                url = this.getItemProperty(obj, options.urlProperty);
                sources = this.support.picture && this.support.source && this.getItemProperty(obj, options.sourcesProperty);
                srcset = this.getItemProperty(obj, options.srcsetProperty);
                sizes = this.getItemProperty(obj, options.sizesProperty);
                title = this.getItemProperty(obj, options.titleProperty);
                altText = this.getItemProperty(obj, options.altTextProperty) || title;
            }
            img.draggable = false;
            if (title) {
                img.title = title;
            }
            if (altText) {
                img.alt = altText;
            }
            $(img).on("load error", callbackWrapper);
            if (sources && sources.length) {
                picture = this.picturePrototype.cloneNode(false);
                for (i = 0; i < sources.length; i += 1) {
                    picture.appendChild($.extend(this.sourcePrototype.cloneNode(false), sources[i]));
                }
                picture.appendChild(img);
                $(picture).addClass(options.toggleClass);
            }
            if (srcset) {
                if (sizes) {
                    img.sizes = sizes;
                }
                img.srcset = srcset;
            }
            img.src = url;
            if (picture) return picture;
            return img;
        },
        createElement: function(obj, callback) {
            var type = obj && this.getItemProperty(obj, this.options.typeProperty);
            var factory = type && this[type.split("/")[0] + "Factory"] || this.imageFactory;
            var element = obj && factory.call(this, obj, callback);
            if (!element) {
                element = this.elementPrototype.cloneNode(false);
                this.setTimeout(callback, [ {
                    type: "error",
                    target: element
                } ]);
            }
            $(element).addClass(this.options.slideContentClass);
            return element;
        },
        iteratePreloadRange: function(index, func) {
            var num = this.num;
            var options = this.options;
            var limit = Math.min(num, options.preloadRange * 2 + 1);
            var j = index;
            var i;
            for (i = 0; i < limit; i += 1) {
                j += i * (i % 2 === 0 ? -1 : 1);
                if (j < 0 || j >= num) {
                    if (!options.continuous) continue;
                    j = this.circle(j);
                }
                func.call(this, j);
            }
        },
        loadElement: function(index) {
            if (!this.elements[index]) {
                if (this.slides[index].firstChild) {
                    this.elements[index] = $(this.slides[index]).hasClass(this.options.slideErrorClass) ? 3 : 2;
                } else {
                    this.elements[index] = 1;
                    $(this.slides[index]).addClass(this.options.slideLoadingClass);
                    this.slides[index].appendChild(this.createElement(this.list[index], this.proxyListener));
                }
            }
        },
        loadElements: function(index) {
            this.iteratePreloadRange(index, this.loadElement);
        },
        unloadElements: function(oldIndex, newIndex) {
            var preloadRange = this.options.preloadRange;
            this.iteratePreloadRange(oldIndex, function(i) {
                var diff = Math.abs(i - newIndex);
                if (diff > preloadRange && diff + preloadRange < this.num) {
                    this.unloadSlide(i);
                    delete this.elements[i];
                }
            });
        },
        addSlide: function(index) {
            var slide = this.slidePrototype.cloneNode(false);
            slide.setAttribute("data-index", index);
            slide.setAttribute("aria-hidden", "true");
            this.slidesContainer[0].appendChild(slide);
            this.slides.push(slide);
        },
        positionSlide: function(index) {
            var slide = this.slides[index];
            slide.style.width = this.slideWidth + "px";
            if (this.support.transform) {
                slide.style.left = index * -this.slideWidth + "px";
                this.move(index, this.index > index ? -this.slideWidth : this.index < index ? this.slideWidth : 0, 0);
            }
        },
        initSlides: function(reload) {
            var clearSlides, i;
            if (!reload) {
                this.positions = [];
                this.positions.length = this.num;
                this.elements = {};
                this.picturePrototype = this.support.picture && document.createElement("picture");
                this.sourcePrototype = this.support.source && document.createElement("source");
                this.imagePrototype = document.createElement("img");
                this.elementPrototype = document.createElement("div");
                this.slidePrototype = this.elementPrototype.cloneNode(false);
                $(this.slidePrototype).addClass(this.options.slideClass);
                this.slides = this.slidesContainer[0].children;
                clearSlides = this.options.clearSlides || this.slides.length !== this.num;
            }
            this.slideWidth = this.container[0].clientWidth;
            this.slideHeight = this.container[0].clientHeight;
            this.slidesContainer[0].style.width = this.num * this.slideWidth + "px";
            if (clearSlides) {
                this.resetSlides();
            }
            for (i = 0; i < this.num; i += 1) {
                if (clearSlides) {
                    this.addSlide(i);
                }
                this.positionSlide(i);
            }
            if (this.options.continuous && this.support.transform) {
                this.move(this.circle(this.index - 1), -this.slideWidth, 0);
                this.move(this.circle(this.index + 1), this.slideWidth, 0);
            }
            if (!this.support.transform) {
                this.slidesContainer[0].style.left = this.index * -this.slideWidth + "px";
            }
        },
        unloadSlide: function(index) {
            var slide, firstChild;
            slide = this.slides[index];
            firstChild = slide.firstChild;
            if (firstChild !== null) {
                slide.removeChild(firstChild);
            }
        },
        unloadAllSlides: function() {
            var i, len;
            for (i = 0, len = this.slides.length; i < len; i++) {
                this.unloadSlide(i);
            }
        },
        toggleControls: function() {
            var controlsClass = this.options.controlsClass;
            if (this.container.hasClass(controlsClass)) {
                this.container.removeClass(controlsClass);
            } else {
                this.container.addClass(controlsClass);
            }
        },
        toggleSlideshow: function() {
            if (!this.interval) {
                this.play();
            } else {
                this.pause();
            }
        },
        getNodeIndex: function(element) {
            return parseInt(element.getAttribute("data-index"), 10);
        },
        getNestedProperty: function(obj, property) {
            property.replace(/\[(?:'([^']+)'|"([^"]+)"|(\d+))\]|(?:(?:^|\.)([^\.\[]+))/g, function(str, singleQuoteProp, doubleQuoteProp, arrayIndex, dotProp) {
                var prop = dotProp || singleQuoteProp || doubleQuoteProp || arrayIndex && parseInt(arrayIndex, 10);
                if (str && obj) {
                    obj = obj[prop];
                }
            });
            return obj;
        },
        getDataProperty: function(obj, property) {
            var key;
            var prop;
            if (obj.dataset) {
                key = property.replace(/-([a-z])/g, function(_, b) {
                    return b.toUpperCase();
                });
                prop = obj.dataset[key];
            } else if (obj.getAttribute) {
                prop = obj.getAttribute("data-" + property.replace(/([A-Z])/g, "-$1").toLowerCase());
            }
            if (typeof prop === "string") {
                if (/^(true|false|null|-?\d+(\.\d+)?|\{[\s\S]*\}|\[[\s\S]*\])$/.test(prop)) {
                    try {
                        return $.parseJSON(prop);
                    } catch (ignore) {}
                }
                return prop;
            }
        },
        getItemProperty: function(obj, property) {
            var prop = this.getDataProperty(obj, property);
            if (prop === undefined) {
                prop = obj[property];
            }
            if (prop === undefined) {
                prop = this.getNestedProperty(obj, property);
            }
            return prop;
        },
        initStartIndex: function() {
            var index = this.options.index;
            var urlProperty = this.options.urlProperty;
            var i;
            if (index && typeof index !== "number") {
                for (i = 0; i < this.num; i += 1) {
                    if (this.list[i] === index || this.getItemProperty(this.list[i], urlProperty) === this.getItemProperty(index, urlProperty)) {
                        index = i;
                        break;
                    }
                }
            }
            this.index = this.circle(parseInt(index, 10) || 0);
        },
        initEventListeners: function() {
            var that = this;
            var slidesContainer = this.slidesContainer;
            function proxyListener(event) {
                var type = that.support.transition && that.support.transition.end === event.type ? "transitionend" : event.type;
                that["on" + type](event);
            }
            $(window).on("resize", proxyListener);
            $(window).on("hashchange", proxyListener);
            $(document.body).on("keydown", proxyListener);
            this.container.on("click", proxyListener);
            if (this.support.touch) {
                slidesContainer.on("touchstart touchmove touchend touchcancel", proxyListener);
            } else if (this.options.emulateTouchEvents && this.support.transition) {
                slidesContainer.on("mousedown mousemove mouseup mouseout", proxyListener);
            }
            if (this.support.transition) {
                slidesContainer.on(this.support.transition.end, proxyListener);
            }
            this.proxyListener = proxyListener;
        },
        destroyEventListeners: function() {
            var slidesContainer = this.slidesContainer;
            var proxyListener = this.proxyListener;
            $(window).off("resize", proxyListener);
            $(document.body).off("keydown", proxyListener);
            this.container.off("click", proxyListener);
            if (this.support.touch) {
                slidesContainer.off("touchstart touchmove touchend touchcancel", proxyListener);
            } else if (this.options.emulateTouchEvents && this.support.transition) {
                slidesContainer.off("mousedown mousemove mouseup mouseout", proxyListener);
            }
            if (this.support.transition) {
                slidesContainer.off(this.support.transition.end, proxyListener);
            }
        },
        handleOpen: function() {
            if (this.options.onopened) {
                this.options.onopened.call(this);
            }
        },
        initWidget: function() {
            var that = this;
            function openHandler(event) {
                if (event.target === that.container[0]) {
                    that.container.off(that.support.transition.end, openHandler);
                    that.handleOpen();
                }
            }
            this.container = $(this.options.container);
            if (!this.container.length) {
                this.console.log("blueimp Gallery: Widget container not found.", this.options.container);
                return false;
            }
            this.slidesContainer = this.container.find(this.options.slidesContainer).first();
            if (!this.slidesContainer.length) {
                this.console.log("blueimp Gallery: Slides container not found.", this.options.slidesContainer);
                return false;
            }
            this.titleElement = this.container.find(this.options.titleElement).first();
            this.playPauseElement = this.container.find("." + this.options.playPauseClass).first();
            if (this.num === 1) {
                this.container.addClass(this.options.singleClass);
            }
            if (this.support.svgasimg) {
                this.container.addClass(this.options.svgasimgClass);
            }
            if (this.support.smil) {
                this.container.addClass(this.options.smilClass);
            }
            if (this.options.onopen) {
                this.options.onopen.call(this);
            }
            if (this.support.transition && this.options.displayTransition) {
                this.container.on(this.support.transition.end, openHandler);
            } else {
                this.handleOpen();
            }
            if (this.options.hidePageScrollbars) {
                this.bodyOverflowStyle = document.body.style.overflow;
                document.body.style.overflow = "hidden";
            }
            this.container[0].style.display = "block";
            this.initSlides();
            this.container.addClass(this.options.displayClass);
        },
        initOptions: function(options) {
            this.options = $.extend({}, this.options);
            if (options && options.carousel || this.options.carousel && (!options || options.carousel !== false)) {
                $.extend(this.options, this.carouselOptions);
            }
            $.extend(this.options, options);
            if (this.num < 3) {
                this.options.continuous = this.options.continuous ? null : false;
            }
            if (!this.support.transition) {
                this.options.emulateTouchEvents = false;
            }
            if (this.options.event) {
                this.preventDefault(this.options.event);
            }
        }
    });
    return Gallery;
});

(function(factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define([ "./blueimp-helper", "./blueimp-gallery" ], factory);
    } else {
        factory(window.blueimp.helper || window.jQuery, window.blueimp.Gallery);
    }
})(function($, Gallery) {
    "use strict";
    var galleryPrototype = Gallery.prototype;
    $.extend(galleryPrototype.options, {
        indicatorContainer: "ol",
        activeIndicatorClass: "active",
        thumbnailProperty: "thumbnail",
        thumbnailIndicators: true
    });
    var initSlides = galleryPrototype.initSlides;
    var addSlide = galleryPrototype.addSlide;
    var resetSlides = galleryPrototype.resetSlides;
    var handleClick = galleryPrototype.handleClick;
    var handleSlide = galleryPrototype.handleSlide;
    var handleClose = galleryPrototype.handleClose;
    $.extend(galleryPrototype, {
        createIndicator: function(obj) {
            var indicator = this.indicatorPrototype.cloneNode(false);
            var title = this.getItemProperty(obj, this.options.titleProperty);
            var thumbnailProperty = this.options.thumbnailProperty;
            var thumbnailUrl;
            var thumbnail;
            if (this.options.thumbnailIndicators) {
                if (thumbnailProperty) {
                    thumbnailUrl = this.getItemProperty(obj, thumbnailProperty);
                }
                if (thumbnailUrl === undefined) {
                    thumbnail = obj.getElementsByTagName && $(obj).find("img")[0];
                    if (thumbnail) {
                        thumbnailUrl = thumbnail.src;
                    }
                }
                if (thumbnailUrl) {
                    indicator.style.backgroundImage = 'url("' + thumbnailUrl + '")';
                }
            }
            if (title) {
                indicator.title = title;
            }
            indicator.setAttribute("role", "link");
            return indicator;
        },
        addIndicator: function(index) {
            if (this.indicatorContainer.length) {
                var indicator = this.createIndicator(this.list[index]);
                indicator.setAttribute("data-index", index);
                this.indicatorContainer[0].appendChild(indicator);
                this.indicators.push(indicator);
            }
        },
        setActiveIndicator: function(index) {
            if (this.indicators) {
                if (this.activeIndicator) {
                    this.activeIndicator.removeClass(this.options.activeIndicatorClass);
                }
                this.activeIndicator = $(this.indicators[index]);
                this.activeIndicator.addClass(this.options.activeIndicatorClass);
            }
        },
        initSlides: function(reload) {
            if (!reload) {
                this.indicatorContainer = this.container.find(this.options.indicatorContainer);
                if (this.indicatorContainer.length) {
                    this.indicatorPrototype = document.createElement("li");
                    this.indicators = this.indicatorContainer[0].children;
                }
            }
            initSlides.call(this, reload);
        },
        addSlide: function(index) {
            addSlide.call(this, index);
            this.addIndicator(index);
        },
        resetSlides: function() {
            resetSlides.call(this);
            this.indicatorContainer.empty();
            this.indicators = [];
        },
        handleClick: function(event) {
            var target = event.target || event.srcElement;
            var parent = target.parentNode;
            if (parent === this.indicatorContainer[0]) {
                this.preventDefault(event);
                this.slide(this.getNodeIndex(target));
            } else if (parent.parentNode === this.indicatorContainer[0]) {
                this.preventDefault(event);
                this.slide(this.getNodeIndex(parent));
            } else {
                return handleClick.call(this, event);
            }
        },
        handleSlide: function(oldIndex, newIndex) {
            handleSlide.call(this, oldIndex, newIndex);
            this.setActiveIndicator(newIndex);
        },
        handleClose: function() {
            if (this.activeIndicator) {
                this.activeIndicator.removeClass(this.options.activeIndicatorClass);
            }
            handleClose.call(this);
        }
    });
    return Gallery;
});

(function(factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define([ "jquery", "./blueimp-gallery" ], factory);
    } else {
        factory(window.jQuery, window.blueimp.Gallery);
    }
})(function($, Gallery) {
    "use strict";
    $(document).on("click", "[data-gallery]", function(event) {
        var id = $(this).data("gallery");
        var widget = $(id);
        var container = widget.length && widget || $(Gallery.prototype.options.container);
        var callbacks = {
            onopen: function() {
                $("#blueimp-gallery").removeClass("d-none");
                container.data("gallery", this).trigger("open");
            },
            onopened: function() {
                container.trigger("opened");
            },
            onslide: function() {
                container.trigger("slide", arguments);
            },
            onslideend: function() {
                container.trigger("slideend", arguments);
            },
            onslidecomplete: function() {
                container.trigger("slidecomplete", arguments);
            },
            onclose: function() {
                $("#blueimp-gallery").addClass("d-none");
                container.trigger("close");
                document.body.style.overflow = null;
            },
            onclosed: function() {
                container.trigger("closed").removeData("gallery");
            }
        };
        var options = $.extend(container.data(), {
            container: container[0],
            index: this,
            event: event
        }, callbacks);
        var links = $(this).closest("[data-gallery-group], body").find('[data-gallery="' + id + '"]');
        if (options.filter) {
            links = links.filter(options.filter);
        }
        return new Gallery(links, options);
    });
});

(function($) {
    $.fn.hovercard = function(options) {
        var defaults = {
            openOnLeft: false,
            openOnTop: false,
            cardImgSrc: "",
            detailsHTML: "",
            loadingHTML: "Loading...",
            errorHTML: "Sorry, no data found.",
            pointsText: "",
            postsText: "",
            background: "#ffffff",
            delay: 0,
            autoAdjust: true,
            onHoverIn: function() {},
            onHoverOut: function() {}
        };
        options = $.extend(defaults, options);
        return this.each(function() {
            var obj = $(this).eq(0);
            obj.wrap('<div class="hc-preview" />');
            obj.addClass("hc-name");
            var hcImg = "";
            if (options.cardImgSrc.length > 0) {
                hcImg = '<img class="hc-pic" src="' + options.cardImgSrc + '" />';
            }
            var hcDetails = '<div class="hc-details" >' + hcImg + options.detailsHTML + "</div>";
            obj.after(hcDetails);
            obj.siblings(".hc-details").eq(0).css({
                background: options.background
            });
            obj.closest(".hc-preview").hoverIntent(function() {
                var $this = $(this);
                adjustToViewPort($this);
                obj.css("zIndex", "200");
                var curHCDetails = $this.find(".hc-details").eq(0);
                curHCDetails.stop(true, true).delay(options.delay).fadeIn();
                if (typeof options.onHoverIn == "function") {
                    var dataUrl;
                    if (curHCDetails.find(".s-card").length <= 0) {
                        dataUrl = options.customDataUrl;
                        if (typeof obj.attr("data-hovercard") == "undefined") {} else if (obj.attr("data-hovercard").length > 0) {
                            dataUrl = obj.attr("data-hovercard");
                        }
                        LoadSocialProfile("yaf", "", dataUrl, curHCDetails, options.customCardJSON);
                    }
                    $("body").on("keydown", function(event) {
                        if (event.keyCode === 27) {
                            closeHoverCard($this);
                        }
                    });
                    var closeButton = curHCDetails.find(".s-close").eq(0);
                    closeButton.click(function() {
                        closeHoverCard($this);
                    });
                    options.onHoverIn.call(this);
                }
            }, function() {
                closeHoverCard($(this));
            });
            function closeHoverCard(card) {
                card.find(".hc-details").eq(0).stop(true, true).fadeOut(300, function() {
                    obj.css("zIndex", "50");
                    if (typeof options.onHoverOut == "function") {
                        options.onHoverOut.call(this);
                    }
                });
                $("body").off("keydown");
            }
            function adjustToViewPort(hcPreview) {
                var hcDetails = hcPreview.find(".hc-details").eq(0);
                var hcPreviewRect = hcPreview[0].getBoundingClientRect();
                var hcdRight = hcPreviewRect.left + 35 + hcDetails.width();
                var hcdBottom = hcPreviewRect.top + 35 + hcDetails.height();
                if (options.openOnLeft || options.autoAdjust && hcdRight > window.innerWidth) {
                    hcDetails.addClass("hc-details-open-left");
                } else {
                    hcDetails.removeClass("hc-details-open-left");
                }
                if (options.openOnTop || options.autoAdjust && hcdBottom > window.innerHeight) {
                    hcDetails.addClass("hc-details-open-top");
                } else {
                    hcDetails.removeClass("hc-details-open-top");
                }
            }
            function LoadSocialProfile(type, href, username, curHCDetails, customCardJSON) {
                var cardHTML, dataType, urlToRequest, customCallback, loadingHTML, errorHTML;
                switch (type) {
                  case "yaf":
                    {
                        dataType = "json", urlToRequest = username, cardHTML = function(profileData) {
                            var online = profileData.Online ? "green" : "red";
                            var shtml = '<div class="s-card s-card-pad">' + '<div class="card rounded-0" style="width: 330px;">' + '<div class="card-header position-relative">' + '<h6 class="card-title text-center">' + (profileData.RealName ? profileData.RealName : profileData.Name) + "</h6>" + (profileData.Avatar ? '<img src="' + profileData.Avatar + '" class="rounded mx-auto d-block" style="width:75px" alt="" />' : "") + (profileData.Avatar ? '<div class="position-absolute" style="top:0;right:0;border-width: 0 25px 25px 0; border-style: solid; border-color: transparent ' + online + ';" ></div>' : "") + "</div>" + '<div class="card-body p-2">' + '<ul class="list-unstyled mt-1 mb-3">' + (profileData.Location ? '<li class="px-2 py-1"><i class="fas fa-home me-1"></i>' + profileData.Location + "</li>" : "") + (profileData.Rank ? '<li class="px-2 py-1"><i class="fas fa-graduation-cap me-1"></i>' + profileData.Rank + "</li>" : "") + (profileData.Interests ? '<li class="px-2 py-1"><i class="fas fa-running me-1"></i>' + profileData.Interests + "</li>" : "") + (profileData.Joined ? '<li class="px-2 py-1"><i class="fas fa-user-check me-1"></i>' + profileData.Joined + "</li>" : "") + (profileData.HomePage ? '<li class="px-2 py-1"><i class="fas fa-globe me-1"></i><a href="' + profileData.HomePage + '" target="_blank">' + profileData.HomePage + "</a></li>" : "") + '<li class="px-2 py-1"><i class="far fa-comment me-1"></i>' + profileData.Posts + "</li>" + "</ul>" + "</div>" + "</div>" + "</div>";
                            return shtml;
                        };
                        loadingHTML = options.loadingHTML;
                        errorHTML = options.errorHTML;
                        customCallback = function() {};
                        curHCDetails.append('<span class="s-action s-close"><a href="javascript:void(0)"><i class="fas fa-times fa-fw"></i></a></span>');
                    }
                    break;

                  default:
                    break;
                }
                if ($.isEmptyObject(customCardJSON)) {
                    $.ajax({
                        url: urlToRequest,
                        type: "GET",
                        dataType: dataType,
                        timeout: 6e3,
                        cache: true,
                        beforeSend: function() {
                            curHCDetails.find(".s-message").remove();
                            curHCDetails.append('<p class="s-message">' + loadingHTML + "</p>");
                        },
                        success: function(data) {
                            if (data.length <= 0) {
                                curHCDetails.find(".s-message").html(errorHTML);
                            } else {
                                curHCDetails.find(".s-message").replaceWith(cardHTML(data));
                                $(".hc-details").hide();
                                adjustToViewPort(curHCDetails.closest(".hc-preview"));
                                curHCDetails.stop(true, true).delay(options.delay).fadeIn();
                                customCallback(data);
                            }
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                            curHCDetails.find(".s-message").html(errorHTML + errorThrown);
                        }
                    });
                } else {
                    curHCDetails.prepend(cardHTML(customCardJSON));
                }
            }
        });
    };
})(jQuery);

(function($) {
    $.fn.hoverIntent = function(handlerIn, handlerOut, selector) {
        var cfg = {
            interval: 100,
            sensitivity: 7,
            timeout: 0
        };
        if (typeof handlerIn === "object") {
            cfg = $.extend(cfg, handlerIn);
        } else if ($.isFunction(handlerOut)) {
            cfg = $.extend(cfg, {
                over: handlerIn,
                out: handlerOut,
                selector: selector
            });
        } else {
            cfg = $.extend(cfg, {
                over: handlerIn,
                out: handlerIn,
                selector: handlerOut
            });
        }
        var cX, cY, pX, pY;
        var track = function(ev) {
            cX = ev.pageX;
            cY = ev.pageY;
        };
        var compare = function(ev, ob) {
            ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
            if (Math.abs(pX - cX) + Math.abs(pY - cY) < cfg.sensitivity) {
                $(ob).off("mousemove.hoverIntent", track);
                ob.hoverIntent_s = 1;
                return cfg.over.apply(ob, [ ev ]);
            } else {
                pX = cX;
                pY = cY;
                ob.hoverIntent_t = setTimeout(function() {
                    compare(ev, ob);
                }, cfg.interval);
            }
        };
        var delay = function(ev, ob) {
            ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
            ob.hoverIntent_s = 0;
            return cfg.out.apply(ob, [ ev ]);
        };
        var handleHover = function(e) {
            var ev = jQuery.extend({}, e);
            var ob = this;
            if (ob.hoverIntent_t) {
                ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
            }
            if (e.type == "mouseenter") {
                pX = ev.pageX;
                pY = ev.pageY;
                $(ob).on("mousemove.hoverIntent", track);
                if (ob.hoverIntent_s != 1) {
                    ob.hoverIntent_t = setTimeout(function() {
                        compare(ev, ob);
                    }, cfg.interval);
                }
            } else {
                $(ob).off("mousemove.hoverIntent", track);
                if (ob.hoverIntent_s == 1) {
                    ob.hoverIntent_t = setTimeout(function() {
                        delay(ev, ob);
                    }, cfg.timeout);
                }
            }
        };
        return this.on({
            "mouseenter.hoverIntent": handleHover,
            "mouseleave.hoverIntent": handleHover
        }, cfg.selector);
    };
})(jQuery);

var _self = typeof window !== "undefined" ? window : typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope ? self : {};

var Prism = function(_self) {
    var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
    var uniqueId = 0;
    var plainTextGrammar = {};
    var _ = {
        manual: _self.Prism && _self.Prism.manual,
        disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
        util: {
            encode: function encode(tokens) {
                if (tokens instanceof Token) {
                    return new Token(tokens.type, encode(tokens.content), tokens.alias);
                } else if (Array.isArray(tokens)) {
                    return tokens.map(encode);
                } else {
                    return tokens.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
                }
            },
            type: function(o) {
                return Object.prototype.toString.call(o).slice(8, -1);
            },
            objId: function(obj) {
                if (!obj["__id"]) {
                    Object.defineProperty(obj, "__id", {
                        value: ++uniqueId
                    });
                }
                return obj["__id"];
            },
            clone: function deepClone(o, visited) {
                visited = visited || {};
                var clone;
                var id;
                switch (_.util.type(o)) {
                  case "Object":
                    id = _.util.objId(o);
                    if (visited[id]) {
                        return visited[id];
                    }
                    clone = {};
                    visited[id] = clone;
                    for (var key in o) {
                        if (o.hasOwnProperty(key)) {
                            clone[key] = deepClone(o[key], visited);
                        }
                    }
                    return clone;

                  case "Array":
                    id = _.util.objId(o);
                    if (visited[id]) {
                        return visited[id];
                    }
                    clone = [];
                    visited[id] = clone;
                    o.forEach(function(v, i) {
                        clone[i] = deepClone(v, visited);
                    });
                    return clone;

                  default:
                    return o;
                }
            },
            getLanguage: function(element) {
                while (element) {
                    var m = lang.exec(element.className);
                    if (m) {
                        return m[1].toLowerCase();
                    }
                    element = element.parentElement;
                }
                return "none";
            },
            setLanguage: function(element, language) {
                element.className = element.className.replace(RegExp(lang, "gi"), "");
                element.classList.add("language-" + language);
            },
            currentScript: function() {
                if (typeof document === "undefined") {
                    return null;
                }
                if ("currentScript" in document && 1 < 2) {
                    return document.currentScript;
                }
                try {
                    throw new Error();
                } catch (err) {
                    var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
                    if (src) {
                        var scripts = document.getElementsByTagName("script");
                        for (var i in scripts) {
                            if (scripts[i].src == src) {
                                return scripts[i];
                            }
                        }
                    }
                    return null;
                }
            },
            isActive: function(element, className, defaultActivation) {
                var no = "no-" + className;
                while (element) {
                    var classList = element.classList;
                    if (classList.contains(className)) {
                        return true;
                    }
                    if (classList.contains(no)) {
                        return false;
                    }
                    element = element.parentElement;
                }
                return !!defaultActivation;
            }
        },
        languages: {
            plain: plainTextGrammar,
            plaintext: plainTextGrammar,
            text: plainTextGrammar,
            txt: plainTextGrammar,
            extend: function(id, redef) {
                var lang = _.util.clone(_.languages[id]);
                for (var key in redef) {
                    lang[key] = redef[key];
                }
                return lang;
            },
            insertBefore: function(inside, before, insert, root) {
                root = root || _.languages;
                var grammar = root[inside];
                var ret = {};
                for (var token in grammar) {
                    if (grammar.hasOwnProperty(token)) {
                        if (token == before) {
                            for (var newToken in insert) {
                                if (insert.hasOwnProperty(newToken)) {
                                    ret[newToken] = insert[newToken];
                                }
                            }
                        }
                        if (!insert.hasOwnProperty(token)) {
                            ret[token] = grammar[token];
                        }
                    }
                }
                var old = root[inside];
                root[inside] = ret;
                _.languages.DFS(_.languages, function(key, value) {
                    if (value === old && key != inside) {
                        this[key] = ret;
                    }
                });
                return ret;
            },
            DFS: function DFS(o, callback, type, visited) {
                visited = visited || {};
                var objId = _.util.objId;
                for (var i in o) {
                    if (o.hasOwnProperty(i)) {
                        callback.call(o, i, o[i], type || i);
                        var property = o[i];
                        var propertyType = _.util.type(property);
                        if (propertyType === "Object" && !visited[objId(property)]) {
                            visited[objId(property)] = true;
                            DFS(property, callback, null, visited);
                        } else if (propertyType === "Array" && !visited[objId(property)]) {
                            visited[objId(property)] = true;
                            DFS(property, callback, i, visited);
                        }
                    }
                }
            }
        },
        plugins: {},
        highlightAll: function(async, callback) {
            _.highlightAllUnder(document, async, callback);
        },
        highlightAllUnder: function(container, async, callback) {
            var env = {
                callback: callback,
                container: container,
                selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
            };
            _.hooks.run("before-highlightall", env);
            env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));
            _.hooks.run("before-all-elements-highlight", env);
            for (var i = 0, element; element = env.elements[i++]; ) {
                _.highlightElement(element, async === true, env.callback);
            }
        },
        highlightElement: function(element, async, callback) {
            var language = _.util.getLanguage(element);
            var grammar = _.languages[language];
            _.util.setLanguage(element, language);
            var parent = element.parentElement;
            if (parent && parent.nodeName.toLowerCase() === "pre") {
                _.util.setLanguage(parent, language);
            }
            var code = element.textContent;
            var env = {
                element: element,
                language: language,
                grammar: grammar,
                code: code
            };
            function insertHighlightedCode(highlightedCode) {
                env.highlightedCode = highlightedCode;
                _.hooks.run("before-insert", env);
                env.element.innerHTML = env.highlightedCode;
                _.hooks.run("after-highlight", env);
                _.hooks.run("complete", env);
                callback && callback.call(env.element);
            }
            _.hooks.run("before-sanity-check", env);
            parent = env.element.parentElement;
            if (parent && parent.nodeName.toLowerCase() === "pre" && !parent.hasAttribute("tabindex")) {
                parent.setAttribute("tabindex", "0");
            }
            if (!env.code) {
                _.hooks.run("complete", env);
                callback && callback.call(env.element);
                return;
            }
            _.hooks.run("before-highlight", env);
            if (!env.grammar) {
                insertHighlightedCode(_.util.encode(env.code));
                return;
            }
            if (async && _self.Worker) {
                var worker = new Worker(_.filename);
                worker.onmessage = function(evt) {
                    insertHighlightedCode(evt.data);
                };
                worker.postMessage(JSON.stringify({
                    language: env.language,
                    code: env.code,
                    immediateClose: true
                }));
            } else {
                insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
            }
        },
        highlight: function(text, grammar, language) {
            var env = {
                code: text,
                grammar: grammar,
                language: language
            };
            _.hooks.run("before-tokenize", env);
            if (!env.grammar) {
                throw new Error('The language "' + env.language + '" has no grammar.');
            }
            env.tokens = _.tokenize(env.code, env.grammar);
            _.hooks.run("after-tokenize", env);
            return Token.stringify(_.util.encode(env.tokens), env.language);
        },
        tokenize: function(text, grammar) {
            var rest = grammar.rest;
            if (rest) {
                for (var token in rest) {
                    grammar[token] = rest[token];
                }
                delete grammar.rest;
            }
            var tokenList = new LinkedList();
            addAfter(tokenList, tokenList.head, text);
            matchGrammar(text, tokenList, grammar, tokenList.head, 0);
            return toArray(tokenList);
        },
        hooks: {
            all: {},
            add: function(name, callback) {
                var hooks = _.hooks.all;
                hooks[name] = hooks[name] || [];
                hooks[name].push(callback);
            },
            run: function(name, env) {
                var callbacks = _.hooks.all[name];
                if (!callbacks || !callbacks.length) {
                    return;
                }
                for (var i = 0, callback; callback = callbacks[i++]; ) {
                    callback(env);
                }
            }
        },
        Token: Token
    };
    _self.Prism = _;
    function Token(type, content, alias, matchedStr) {
        this.type = type;
        this.content = content;
        this.alias = alias;
        this.length = (matchedStr || "").length | 0;
    }
    Token.stringify = function stringify(o, language) {
        if (typeof o == "string") {
            return o;
        }
        if (Array.isArray(o)) {
            var s = "";
            o.forEach(function(e) {
                s += stringify(e, language);
            });
            return s;
        }
        var env = {
            type: o.type,
            content: stringify(o.content, language),
            tag: "span",
            classes: [ "token", o.type ],
            attributes: {},
            language: language
        };
        var aliases = o.alias;
        if (aliases) {
            if (Array.isArray(aliases)) {
                Array.prototype.push.apply(env.classes, aliases);
            } else {
                env.classes.push(aliases);
            }
        }
        _.hooks.run("wrap", env);
        var attributes = "";
        for (var name in env.attributes) {
            attributes += " " + name + '="' + (env.attributes[name] || "").replace(/"/g, "&quot;") + '"';
        }
        return "<" + env.tag + ' class="' + env.classes.join(" ") + '"' + attributes + ">" + env.content + "</" + env.tag + ">";
    };
    function matchPattern(pattern, pos, text, lookbehind) {
        pattern.lastIndex = pos;
        var match = pattern.exec(text);
        if (match && lookbehind && match[1]) {
            var lookbehindLength = match[1].length;
            match.index += lookbehindLength;
            match[0] = match[0].slice(lookbehindLength);
        }
        return match;
    }
    function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
        for (var token in grammar) {
            if (!grammar.hasOwnProperty(token) || !grammar[token]) {
                continue;
            }
            var patterns = grammar[token];
            patterns = Array.isArray(patterns) ? patterns : [ patterns ];
            for (var j = 0; j < patterns.length; ++j) {
                if (rematch && rematch.cause == token + "," + j) {
                    return;
                }
                var patternObj = patterns[j];
                var inside = patternObj.inside;
                var lookbehind = !!patternObj.lookbehind;
                var greedy = !!patternObj.greedy;
                var alias = patternObj.alias;
                if (greedy && !patternObj.pattern.global) {
                    var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
                    patternObj.pattern = RegExp(patternObj.pattern.source, flags + "g");
                }
                var pattern = patternObj.pattern || patternObj;
                for (var currentNode = startNode.next, pos = startPos; currentNode !== tokenList.tail; pos += currentNode.value.length, 
                currentNode = currentNode.next) {
                    if (rematch && pos >= rematch.reach) {
                        break;
                    }
                    var str = currentNode.value;
                    if (tokenList.length > text.length) {
                        return;
                    }
                    if (str instanceof Token) {
                        continue;
                    }
                    var removeCount = 1;
                    var match;
                    if (greedy) {
                        match = matchPattern(pattern, pos, text, lookbehind);
                        if (!match || match.index >= text.length) {
                            break;
                        }
                        var from = match.index;
                        var to = match.index + match[0].length;
                        var p = pos;
                        p += currentNode.value.length;
                        while (from >= p) {
                            currentNode = currentNode.next;
                            p += currentNode.value.length;
                        }
                        p -= currentNode.value.length;
                        pos = p;
                        if (currentNode.value instanceof Token) {
                            continue;
                        }
                        for (var k = currentNode; k !== tokenList.tail && (p < to || typeof k.value === "string"); k = k.next) {
                            removeCount++;
                            p += k.value.length;
                        }
                        removeCount--;
                        str = text.slice(pos, p);
                        match.index -= pos;
                    } else {
                        match = matchPattern(pattern, 0, str, lookbehind);
                        if (!match) {
                            continue;
                        }
                    }
                    var from = match.index;
                    var matchStr = match[0];
                    var before = str.slice(0, from);
                    var after = str.slice(from + matchStr.length);
                    var reach = pos + str.length;
                    if (rematch && reach > rematch.reach) {
                        rematch.reach = reach;
                    }
                    var removeFrom = currentNode.prev;
                    if (before) {
                        removeFrom = addAfter(tokenList, removeFrom, before);
                        pos += before.length;
                    }
                    removeRange(tokenList, removeFrom, removeCount);
                    var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
                    currentNode = addAfter(tokenList, removeFrom, wrapped);
                    if (after) {
                        addAfter(tokenList, currentNode, after);
                    }
                    if (removeCount > 1) {
                        var nestedRematch = {
                            cause: token + "," + j,
                            reach: reach
                        };
                        matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);
                        if (rematch && nestedRematch.reach > rematch.reach) {
                            rematch.reach = nestedRematch.reach;
                        }
                    }
                }
            }
        }
    }
    function LinkedList() {
        var head = {
            value: null,
            prev: null,
            next: null
        };
        var tail = {
            value: null,
            prev: head,
            next: null
        };
        head.next = tail;
        this.head = head;
        this.tail = tail;
        this.length = 0;
    }
    function addAfter(list, node, value) {
        var next = node.next;
        var newNode = {
            value: value,
            prev: node,
            next: next
        };
        node.next = newNode;
        next.prev = newNode;
        list.length++;
        return newNode;
    }
    function removeRange(list, node, count) {
        var next = node.next;
        for (var i = 0; i < count && next !== list.tail; i++) {
            next = next.next;
        }
        node.next = next;
        next.prev = node;
        list.length -= i;
    }
    function toArray(list) {
        var array = [];
        var node = list.head.next;
        while (node !== list.tail) {
            array.push(node.value);
            node = node.next;
        }
        return array;
    }
    if (!_self.document) {
        if (!_self.addEventListener) {
            return _;
        }
        if (!_.disableWorkerMessageHandler) {
            _self.addEventListener("message", function(evt) {
                var message = JSON.parse(evt.data);
                var lang = message.language;
                var code = message.code;
                var immediateClose = message.immediateClose;
                _self.postMessage(_.highlight(code, _.languages[lang], lang));
                if (immediateClose) {
                    _self.close();
                }
            }, false);
        }
        return _;
    }
    var script = _.util.currentScript();
    if (script) {
        _.filename = script.src;
        if (script.hasAttribute("data-manual")) {
            _.manual = true;
        }
    }
    function highlightAutomaticallyCallback() {
        if (!_.manual) {
            _.highlightAll();
        }
    }
    if (!_.manual) {
        var readyState = document.readyState;
        if (readyState === "loading" || readyState === "interactive" && script && script.defer) {
            document.addEventListener("DOMContentLoaded", highlightAutomaticallyCallback);
        } else {
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(highlightAutomaticallyCallback);
            } else {
                window.setTimeout(highlightAutomaticallyCallback, 16);
            }
        }
    }
    return _;
}(_self);

if (typeof module !== "undefined" && module.exports) {
    module.exports = Prism;
}

if (typeof global !== "undefined") {
    global.Prism = Prism;
}

Prism.languages.markup = {
    comment: {
        pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
        greedy: true
    },
    prolog: {
        pattern: /<\?[\s\S]+?\?>/,
        greedy: true
    },
    doctype: {
        pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
        greedy: true,
        inside: {
            "internal-subset": {
                pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
                lookbehind: true,
                greedy: true,
                inside: null
            },
            string: {
                pattern: /"[^"]*"|'[^']*'/,
                greedy: true
            },
            punctuation: /^<!|>$|[[\]]/,
            "doctype-tag": /^DOCTYPE/i,
            name: /[^\s<>'"]+/
        }
    },
    cdata: {
        pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
        greedy: true
    },
    tag: {
        pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
        greedy: true,
        inside: {
            tag: {
                pattern: /^<\/?[^\s>\/]+/,
                inside: {
                    punctuation: /^<\/?/,
                    namespace: /^[^\s>\/:]+:/
                }
            },
            "special-attr": [],
            "attr-value": {
                pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
                inside: {
                    punctuation: [ {
                        pattern: /^=/,
                        alias: "attr-equals"
                    }, /"|'/ ]
                }
            },
            punctuation: /\/?>/,
            "attr-name": {
                pattern: /[^\s>\/]+/,
                inside: {
                    namespace: /^[^\s>\/:]+:/
                }
            }
        }
    },
    entity: [ {
        pattern: /&[\da-z]{1,8};/i,
        alias: "named-entity"
    }, /&#x?[\da-f]{1,8};/i ]
};

Prism.languages.markup["tag"].inside["attr-value"].inside["entity"] = Prism.languages.markup["entity"];

Prism.languages.markup["doctype"].inside["internal-subset"].inside = Prism.languages.markup;

Prism.hooks.add("wrap", function(env) {
    if (env.type === "entity") {
        env.attributes["title"] = env.content.replace(/&amp;/, "&");
    }
});

Object.defineProperty(Prism.languages.markup.tag, "addInlined", {
    value: function addInlined(tagName, lang) {
        var includedCdataInside = {};
        includedCdataInside["language-" + lang] = {
            pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
            lookbehind: true,
            inside: Prism.languages[lang]
        };
        includedCdataInside["cdata"] = /^<!\[CDATA\[|\]\]>$/i;
        var inside = {
            "included-cdata": {
                pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
                inside: includedCdataInside
            }
        };
        inside["language-" + lang] = {
            pattern: /[\s\S]+/,
            inside: Prism.languages[lang]
        };
        var def = {};
        def[tagName] = {
            pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function() {
                return tagName;
            }), "i"),
            lookbehind: true,
            greedy: true,
            inside: inside
        };
        Prism.languages.insertBefore("markup", "cdata", def);
    }
});

Object.defineProperty(Prism.languages.markup.tag, "addAttribute", {
    value: function(attrName, lang) {
        Prism.languages.markup.tag.inside["special-attr"].push({
            pattern: RegExp(/(^|["'\s])/.source + "(?:" + attrName + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source, "i"),
            lookbehind: true,
            inside: {
                "attr-name": /^[^\s=]+/,
                "attr-value": {
                    pattern: /=[\s\S]+/,
                    inside: {
                        value: {
                            pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                            lookbehind: true,
                            alias: [ lang, "language-" + lang ],
                            inside: Prism.languages[lang]
                        },
                        punctuation: [ {
                            pattern: /^=/,
                            alias: "attr-equals"
                        }, /"|'/ ]
                    }
                }
            }
        });
    }
});

Prism.languages.html = Prism.languages.markup;

Prism.languages.mathml = Prism.languages.markup;

Prism.languages.svg = Prism.languages.markup;

Prism.languages.xml = Prism.languages.extend("markup", {});

Prism.languages.ssml = Prism.languages.xml;

Prism.languages.atom = Prism.languages.xml;

Prism.languages.rss = Prism.languages.xml;

(function(Prism) {
    var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
    Prism.languages.css = {
        comment: /\/\*[\s\S]*?\*\//,
        atrule: {
            pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/,
            inside: {
                rule: /^@[\w-]+/,
                "selector-function-argument": {
                    pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
                    lookbehind: true,
                    alias: "selector"
                },
                keyword: {
                    pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
                    lookbehind: true
                }
            }
        },
        url: {
            pattern: RegExp("\\burl\\((?:" + string.source + "|" + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ")\\)", "i"),
            greedy: true,
            inside: {
                function: /^url/i,
                punctuation: /^\(|\)$/,
                string: {
                    pattern: RegExp("^" + string.source + "$"),
                    alias: "url"
                }
            }
        },
        selector: {
            pattern: RegExp("(^|[{}\\s])[^{}\\s](?:[^{};\"'\\s]|\\s+(?![\\s{])|" + string.source + ")*(?=\\s*\\{)"),
            lookbehind: true
        },
        string: {
            pattern: string,
            greedy: true
        },
        property: {
            pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
            lookbehind: true
        },
        important: /!important\b/i,
        function: {
            pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
            lookbehind: true
        },
        punctuation: /[(){};:,]/
    };
    Prism.languages.css["atrule"].inside.rest = Prism.languages.css;
    var markup = Prism.languages.markup;
    if (markup) {
        markup.tag.addInlined("style", "css");
        markup.tag.addAttribute("style", "css");
    }
})(Prism);

Prism.languages.clike = {
    comment: [ {
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
        lookbehind: true,
        greedy: true
    }, {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: true,
        greedy: true
    } ],
    string: {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true
    },
    "class-name": {
        pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
        lookbehind: true,
        inside: {
            punctuation: /[.\\]/
        }
    },
    keyword: /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
    boolean: /\b(?:false|true)\b/,
    function: /\b\w+(?=\()/,
    number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    punctuation: /[{}[\];(),.:]/
};

Prism.languages.javascript = Prism.languages.extend("clike", {
    "class-name": [ Prism.languages.clike["class-name"], {
        pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
        lookbehind: true
    } ],
    keyword: [ {
        pattern: /((?:^|\})\s*)catch\b/,
        lookbehind: true
    }, {
        pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
        lookbehind: true
    } ],
    function: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    number: {
        pattern: RegExp(/(^|[^\w$])/.source + "(?:" + (/NaN|Infinity/.source + "|" + /0[bB][01]+(?:_[01]+)*n?/.source + "|" + /0[oO][0-7]+(?:_[0-7]+)*n?/.source + "|" + /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source + "|" + /\d+(?:_\d+)*n/.source + "|" + /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source) + ")" + /(?![\w$])/.source),
        lookbehind: true
    },
    operator: /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
});

Prism.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;

Prism.languages.insertBefore("javascript", "keyword", {
    regex: {
        pattern: RegExp(/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source + /\//.source + "(?:" + /(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source + "|" + /(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source + ")" + /(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source),
        lookbehind: true,
        greedy: true,
        inside: {
            "regex-source": {
                pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
                lookbehind: true,
                alias: "language-regex",
                inside: Prism.languages.regex
            },
            "regex-delimiter": /^\/|\/$/,
            "regex-flags": /^[a-z]+$/
        }
    },
    "function-variable": {
        pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
        alias: "function"
    },
    parameter: [ {
        pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
        lookbehind: true,
        inside: Prism.languages.javascript
    }, {
        pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
        lookbehind: true,
        inside: Prism.languages.javascript
    }, {
        pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
        lookbehind: true,
        inside: Prism.languages.javascript
    }, {
        pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
        lookbehind: true,
        inside: Prism.languages.javascript
    } ],
    constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism.languages.insertBefore("javascript", "string", {
    hashbang: {
        pattern: /^#!.*/,
        greedy: true,
        alias: "comment"
    },
    "template-string": {
        pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
        greedy: true,
        inside: {
            "template-punctuation": {
                pattern: /^`|`$/,
                alias: "string"
            },
            interpolation: {
                pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
                lookbehind: true,
                inside: {
                    "interpolation-punctuation": {
                        pattern: /^\$\{|\}$/,
                        alias: "punctuation"
                    },
                    rest: Prism.languages.javascript
                }
            },
            string: /[\s\S]+/
        }
    },
    "string-property": {
        pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
        lookbehind: true,
        greedy: true,
        alias: "property"
    }
});

Prism.languages.insertBefore("javascript", "operator", {
    "literal-property": {
        pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
        lookbehind: true,
        alias: "property"
    }
});

if (Prism.languages.markup) {
    Prism.languages.markup.tag.addInlined("script", "javascript");
    Prism.languages.markup.tag.addAttribute(/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source, "javascript");
}

Prism.languages.js = Prism.languages.javascript;

(function(Prism) {
    function replace(pattern, replacements) {
        return pattern.replace(/<<(\d+)>>/g, function(m, index) {
            return "(?:" + replacements[+index] + ")";
        });
    }
    function re(pattern, replacements, flags) {
        return RegExp(replace(pattern, replacements), flags || "");
    }
    function nested(pattern, depthLog2) {
        for (var i = 0; i < depthLog2; i++) {
            pattern = pattern.replace(/<<self>>/g, function() {
                return "(?:" + pattern + ")";
            });
        }
        return pattern.replace(/<<self>>/g, "[^\\s\\S]");
    }
    var keywordKinds = {
        type: "bool byte char decimal double dynamic float int long object sbyte short string uint ulong ushort var void",
        typeDeclaration: "class enum interface record struct",
        contextual: "add alias and ascending async await by descending from(?=\\s*(?:\\w|$)) get global group into init(?=\\s*;) join let nameof not notnull on or orderby partial remove select set unmanaged value when where with(?=\\s*{)",
        other: "abstract as base break case catch checked const continue default delegate do else event explicit extern finally fixed for foreach goto if implicit in internal is lock namespace new null operator out override params private protected public readonly ref return sealed sizeof stackalloc static switch this throw try typeof unchecked unsafe using virtual volatile while yield"
    };
    function keywordsToPattern(words) {
        return "\\b(?:" + words.trim().replace(/ /g, "|") + ")\\b";
    }
    var typeDeclarationKeywords = keywordsToPattern(keywordKinds.typeDeclaration);
    var keywords = RegExp(keywordsToPattern(keywordKinds.type + " " + keywordKinds.typeDeclaration + " " + keywordKinds.contextual + " " + keywordKinds.other));
    var nonTypeKeywords = keywordsToPattern(keywordKinds.typeDeclaration + " " + keywordKinds.contextual + " " + keywordKinds.other);
    var nonContextualKeywords = keywordsToPattern(keywordKinds.type + " " + keywordKinds.typeDeclaration + " " + keywordKinds.other);
    var generic = nested(/<(?:[^<>;=+\-*/%&|^]|<<self>>)*>/.source, 2);
    var nestedRound = nested(/\((?:[^()]|<<self>>)*\)/.source, 2);
    var name = /@?\b[A-Za-z_]\w*\b/.source;
    var genericName = replace(/<<0>>(?:\s*<<1>>)?/.source, [ name, generic ]);
    var identifier = replace(/(?!<<0>>)<<1>>(?:\s*\.\s*<<1>>)*/.source, [ nonTypeKeywords, genericName ]);
    var array = /\[\s*(?:,\s*)*\]/.source;
    var typeExpressionWithoutTuple = replace(/<<0>>(?:\s*(?:\?\s*)?<<1>>)*(?:\s*\?)?/.source, [ identifier, array ]);
    var tupleElement = replace(/[^,()<>[\];=+\-*/%&|^]|<<0>>|<<1>>|<<2>>/.source, [ generic, nestedRound, array ]);
    var tuple = replace(/\(<<0>>+(?:,<<0>>+)+\)/.source, [ tupleElement ]);
    var typeExpression = replace(/(?:<<0>>|<<1>>)(?:\s*(?:\?\s*)?<<2>>)*(?:\s*\?)?/.source, [ tuple, identifier, array ]);
    var typeInside = {
        keyword: keywords,
        punctuation: /[<>()?,.:[\]]/
    };
    var character = /'(?:[^\r\n'\\]|\\.|\\[Uux][\da-fA-F]{1,8})'/.source;
    var regularString = /"(?:\\.|[^\\"\r\n])*"/.source;
    var verbatimString = /@"(?:""|\\[\s\S]|[^\\"])*"(?!")/.source;
    Prism.languages.csharp = Prism.languages.extend("clike", {
        string: [ {
            pattern: re(/(^|[^$\\])<<0>>/.source, [ verbatimString ]),
            lookbehind: true,
            greedy: true
        }, {
            pattern: re(/(^|[^@$\\])<<0>>/.source, [ regularString ]),
            lookbehind: true,
            greedy: true
        } ],
        "class-name": [ {
            pattern: re(/(\busing\s+static\s+)<<0>>(?=\s*;)/.source, [ identifier ]),
            lookbehind: true,
            inside: typeInside
        }, {
            pattern: re(/(\busing\s+<<0>>\s*=\s*)<<1>>(?=\s*;)/.source, [ name, typeExpression ]),
            lookbehind: true,
            inside: typeInside
        }, {
            pattern: re(/(\busing\s+)<<0>>(?=\s*=)/.source, [ name ]),
            lookbehind: true
        }, {
            pattern: re(/(\b<<0>>\s+)<<1>>/.source, [ typeDeclarationKeywords, genericName ]),
            lookbehind: true,
            inside: typeInside
        }, {
            pattern: re(/(\bcatch\s*\(\s*)<<0>>/.source, [ identifier ]),
            lookbehind: true,
            inside: typeInside
        }, {
            pattern: re(/(\bwhere\s+)<<0>>/.source, [ name ]),
            lookbehind: true
        }, {
            pattern: re(/(\b(?:is(?:\s+not)?|as)\s+)<<0>>/.source, [ typeExpressionWithoutTuple ]),
            lookbehind: true,
            inside: typeInside
        }, {
            pattern: re(/\b<<0>>(?=\s+(?!<<1>>|with\s*\{)<<2>>(?:\s*[=,;:{)\]]|\s+(?:in|when)\b))/.source, [ typeExpression, nonContextualKeywords, name ]),
            inside: typeInside
        } ],
        keyword: keywords,
        number: /(?:\b0(?:x[\da-f_]*[\da-f]|b[01_]*[01])|(?:\B\.\d+(?:_+\d+)*|\b\d+(?:_+\d+)*(?:\.\d+(?:_+\d+)*)?)(?:e[-+]?\d+(?:_+\d+)*)?)(?:[dflmu]|lu|ul)?\b/i,
        operator: />>=?|<<=?|[-=]>|([-+&|])\1|~|\?\?=?|[-+*/%&|^!=<>]=?/,
        punctuation: /\?\.?|::|[{}[\];(),.:]/
    });
    Prism.languages.insertBefore("csharp", "number", {
        range: {
            pattern: /\.\./,
            alias: "operator"
        }
    });
    Prism.languages.insertBefore("csharp", "punctuation", {
        "named-parameter": {
            pattern: re(/([(,]\s*)<<0>>(?=\s*:)/.source, [ name ]),
            lookbehind: true,
            alias: "punctuation"
        }
    });
    Prism.languages.insertBefore("csharp", "class-name", {
        namespace: {
            pattern: re(/(\b(?:namespace|using)\s+)<<0>>(?:\s*\.\s*<<0>>)*(?=\s*[;{])/.source, [ name ]),
            lookbehind: true,
            inside: {
                punctuation: /\./
            }
        },
        "type-expression": {
            pattern: re(/(\b(?:default|sizeof|typeof)\s*\(\s*(?!\s))(?:[^()\s]|\s(?!\s)|<<0>>)*(?=\s*\))/.source, [ nestedRound ]),
            lookbehind: true,
            alias: "class-name",
            inside: typeInside
        },
        "return-type": {
            pattern: re(/<<0>>(?=\s+(?:<<1>>\s*(?:=>|[({]|\.\s*this\s*\[)|this\s*\[))/.source, [ typeExpression, identifier ]),
            inside: typeInside,
            alias: "class-name"
        },
        "constructor-invocation": {
            pattern: re(/(\bnew\s+)<<0>>(?=\s*[[({])/.source, [ typeExpression ]),
            lookbehind: true,
            inside: typeInside,
            alias: "class-name"
        },
        "generic-method": {
            pattern: re(/<<0>>\s*<<1>>(?=\s*\()/.source, [ name, generic ]),
            inside: {
                function: re(/^<<0>>/.source, [ name ]),
                generic: {
                    pattern: RegExp(generic),
                    alias: "class-name",
                    inside: typeInside
                }
            }
        },
        "type-list": {
            pattern: re(/\b((?:<<0>>\s+<<1>>|record\s+<<1>>\s*<<5>>|where\s+<<2>>)\s*:\s*)(?:<<3>>|<<4>>|<<1>>\s*<<5>>|<<6>>)(?:\s*,\s*(?:<<3>>|<<4>>|<<6>>))*(?=\s*(?:where|[{;]|=>|$))/.source, [ typeDeclarationKeywords, genericName, name, typeExpression, keywords.source, nestedRound, /\bnew\s*\(\s*\)/.source ]),
            lookbehind: true,
            inside: {
                "record-arguments": {
                    pattern: re(/(^(?!new\s*\()<<0>>\s*)<<1>>/.source, [ genericName, nestedRound ]),
                    lookbehind: true,
                    greedy: true,
                    inside: Prism.languages.csharp
                },
                keyword: keywords,
                "class-name": {
                    pattern: RegExp(typeExpression),
                    greedy: true,
                    inside: typeInside
                },
                punctuation: /[,()]/
            }
        },
        preprocessor: {
            pattern: /(^[\t ]*)#.*/m,
            lookbehind: true,
            alias: "property",
            inside: {
                directive: {
                    pattern: /(#)\b(?:define|elif|else|endif|endregion|error|if|line|nullable|pragma|region|undef|warning)\b/,
                    lookbehind: true,
                    alias: "keyword"
                }
            }
        }
    });
    var regularStringOrCharacter = regularString + "|" + character;
    var regularStringCharacterOrComment = replace(/\/(?![*/])|\/\/[^\r\n]*[\r\n]|\/\*(?:[^*]|\*(?!\/))*\*\/|<<0>>/.source, [ regularStringOrCharacter ]);
    var roundExpression = nested(replace(/[^"'/()]|<<0>>|\(<<self>>*\)/.source, [ regularStringCharacterOrComment ]), 2);
    var attrTarget = /\b(?:assembly|event|field|method|module|param|property|return|type)\b/.source;
    var attr = replace(/<<0>>(?:\s*\(<<1>>*\))?/.source, [ identifier, roundExpression ]);
    Prism.languages.insertBefore("csharp", "class-name", {
        attribute: {
            pattern: re(/((?:^|[^\s\w>)?])\s*\[\s*)(?:<<0>>\s*:\s*)?<<1>>(?:\s*,\s*<<1>>)*(?=\s*\])/.source, [ attrTarget, attr ]),
            lookbehind: true,
            greedy: true,
            inside: {
                target: {
                    pattern: re(/^<<0>>(?=\s*:)/.source, [ attrTarget ]),
                    alias: "keyword"
                },
                "attribute-arguments": {
                    pattern: re(/\(<<0>>*\)/.source, [ roundExpression ]),
                    inside: Prism.languages.csharp
                },
                "class-name": {
                    pattern: RegExp(identifier),
                    inside: {
                        punctuation: /\./
                    }
                },
                punctuation: /[:,]/
            }
        }
    });
    var formatString = /:[^}\r\n]+/.source;
    var mInterpolationRound = nested(replace(/[^"'/()]|<<0>>|\(<<self>>*\)/.source, [ regularStringCharacterOrComment ]), 2);
    var mInterpolation = replace(/\{(?!\{)(?:(?![}:])<<0>>)*<<1>>?\}/.source, [ mInterpolationRound, formatString ]);
    var sInterpolationRound = nested(replace(/[^"'/()]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|<<0>>|\(<<self>>*\)/.source, [ regularStringOrCharacter ]), 2);
    var sInterpolation = replace(/\{(?!\{)(?:(?![}:])<<0>>)*<<1>>?\}/.source, [ sInterpolationRound, formatString ]);
    function createInterpolationInside(interpolation, interpolationRound) {
        return {
            interpolation: {
                pattern: re(/((?:^|[^{])(?:\{\{)*)<<0>>/.source, [ interpolation ]),
                lookbehind: true,
                inside: {
                    "format-string": {
                        pattern: re(/(^\{(?:(?![}:])<<0>>)*)<<1>>(?=\}$)/.source, [ interpolationRound, formatString ]),
                        lookbehind: true,
                        inside: {
                            punctuation: /^:/
                        }
                    },
                    punctuation: /^\{|\}$/,
                    expression: {
                        pattern: /[\s\S]+/,
                        alias: "language-csharp",
                        inside: Prism.languages.csharp
                    }
                }
            },
            string: /[\s\S]+/
        };
    }
    Prism.languages.insertBefore("csharp", "string", {
        "interpolation-string": [ {
            pattern: re(/(^|[^\\])(?:\$@|@\$)"(?:""|\\[\s\S]|\{\{|<<0>>|[^\\{"])*"/.source, [ mInterpolation ]),
            lookbehind: true,
            greedy: true,
            inside: createInterpolationInside(mInterpolation, mInterpolationRound)
        }, {
            pattern: re(/(^|[^@\\])\$"(?:\\.|\{\{|<<0>>|[^\\"{])*"/.source, [ sInterpolation ]),
            lookbehind: true,
            greedy: true,
            inside: createInterpolationInside(sInterpolation, sInterpolationRound)
        } ],
        char: {
            pattern: RegExp(character),
            greedy: true
        }
    });
    Prism.languages.dotnet = Prism.languages.cs = Prism.languages.csharp;
})(Prism);

Prism.languages.aspnet = Prism.languages.extend("markup", {
    "page-directive": {
        pattern: /<%\s*@.*%>/,
        alias: "tag",
        inside: {
            "page-directive": {
                pattern: /<%\s*@\s*(?:Assembly|Control|Implements|Import|Master(?:Type)?|OutputCache|Page|PreviousPageType|Reference|Register)?|%>/i,
                alias: "tag"
            },
            rest: Prism.languages.markup.tag.inside
        }
    },
    directive: {
        pattern: /<%.*%>/,
        alias: "tag",
        inside: {
            directive: {
                pattern: /<%\s*?[$=%#:]{0,2}|%>/,
                alias: "tag"
            },
            rest: Prism.languages.csharp
        }
    }
});

Prism.languages.aspnet.tag.pattern = /<(?!%)\/?[^\s>\/]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/;

Prism.languages.insertBefore("inside", "punctuation", {
    directive: Prism.languages.aspnet["directive"]
}, Prism.languages.aspnet.tag.inside["attr-value"]);

Prism.languages.insertBefore("aspnet", "comment", {
    "asp-comment": {
        pattern: /<%--[\s\S]*?--%>/,
        alias: [ "asp", "comment" ]
    }
});

Prism.languages.insertBefore("aspnet", Prism.languages.javascript ? "script" : "tag", {
    "asp-script": {
        pattern: /(<script(?=.*runat=['"]?server\b)[^>]*>)[\s\S]*?(?=<\/script>)/i,
        lookbehind: true,
        alias: [ "asp", "script" ],
        inside: Prism.languages.csharp || {}
    }
});

(function(Prism) {
    var envVars = "\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|GDMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HOSTTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHONE|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OSTYPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRENT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b";
    var commandAfterHeredoc = {
        pattern: /(^(["']?)\w+\2)[ \t]+\S.*/,
        lookbehind: true,
        alias: "punctuation",
        inside: null
    };
    var insideString = {
        bash: commandAfterHeredoc,
        environment: {
            pattern: RegExp("\\$" + envVars),
            alias: "constant"
        },
        variable: [ {
            pattern: /\$?\(\([\s\S]+?\)\)/,
            greedy: true,
            inside: {
                variable: [ {
                    pattern: /(^\$\(\([\s\S]+)\)\)/,
                    lookbehind: true
                }, /^\$\(\(/ ],
                number: /\b0x[\dA-Fa-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee]-?\d+)?/,
                operator: /--|\+\+|\*\*=?|<<=?|>>=?|&&|\|\||[=!+\-*/%<>^&|]=?|[?~:]/,
                punctuation: /\(\(?|\)\)?|,|;/
            }
        }, {
            pattern: /\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,
            greedy: true,
            inside: {
                variable: /^\$\(|^`|\)$|`$/
            }
        }, {
            pattern: /\$\{[^}]+\}/,
            greedy: true,
            inside: {
                operator: /:[-=?+]?|[!\/]|##?|%%?|\^\^?|,,?/,
                punctuation: /[\[\]]/,
                environment: {
                    pattern: RegExp("(\\{)" + envVars),
                    lookbehind: true,
                    alias: "constant"
                }
            }
        }, /\$(?:\w+|[#?*!@$])/ ],
        entity: /\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|U[0-9a-fA-F]{8}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{1,2})/
    };
    Prism.languages.bash = {
        shebang: {
            pattern: /^#!\s*\/.*/,
            alias: "important"
        },
        comment: {
            pattern: /(^|[^"{\\$])#.*/,
            lookbehind: true
        },
        "function-name": [ {
            pattern: /(\bfunction\s+)[\w-]+(?=(?:\s*\(?:\s*\))?\s*\{)/,
            lookbehind: true,
            alias: "function"
        }, {
            pattern: /\b[\w-]+(?=\s*\(\s*\)\s*\{)/,
            alias: "function"
        } ],
        "for-or-select": {
            pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
            alias: "variable",
            lookbehind: true
        },
        "assign-left": {
            pattern: /(^|[\s;|&]|[<>]\()\w+(?=\+?=)/,
            inside: {
                environment: {
                    pattern: RegExp("(^|[\\s;|&]|[<>]\\()" + envVars),
                    lookbehind: true,
                    alias: "constant"
                }
            },
            alias: "variable",
            lookbehind: true
        },
        string: [ {
            pattern: /((?:^|[^<])<<-?\s*)(\w+)\s[\s\S]*?(?:\r?\n|\r)\2/,
            lookbehind: true,
            greedy: true,
            inside: insideString
        }, {
            pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s[\s\S]*?(?:\r?\n|\r)\3/,
            lookbehind: true,
            greedy: true,
            inside: {
                bash: commandAfterHeredoc
            }
        }, {
            pattern: /(^|[^\\](?:\\\\)*)"(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|[^"\\`$])*"/,
            lookbehind: true,
            greedy: true,
            inside: insideString
        }, {
            pattern: /(^|[^$\\])'[^']*'/,
            lookbehind: true,
            greedy: true
        }, {
            pattern: /\$'(?:[^'\\]|\\[\s\S])*'/,
            greedy: true,
            inside: {
                entity: insideString.entity
            }
        } ],
        environment: {
            pattern: RegExp("\\$?" + envVars),
            alias: "constant"
        },
        variable: insideString.variable,
        function: {
            pattern: /(^|[\s;|&]|[<>]\()(?:add|apropos|apt|apt-cache|apt-get|aptitude|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|composer|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|docker|docker-compose|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|node|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|podman|podman-compose|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vcpkg|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,
            lookbehind: true
        },
        keyword: {
            pattern: /(^|[\s;|&]|[<>]\()(?:case|do|done|elif|else|esac|fi|for|function|if|in|select|then|until|while)(?=$|[)\s;|&])/,
            lookbehind: true
        },
        builtin: {
            pattern: /(^|[\s;|&]|[<>]\()(?:\.|:|alias|bind|break|builtin|caller|cd|command|continue|declare|echo|enable|eval|exec|exit|export|getopts|hash|help|let|local|logout|mapfile|printf|pwd|read|readarray|readonly|return|set|shift|shopt|source|test|times|trap|type|typeset|ulimit|umask|unalias|unset)(?=$|[)\s;|&])/,
            lookbehind: true,
            alias: "class-name"
        },
        boolean: {
            pattern: /(^|[\s;|&]|[<>]\()(?:false|true)(?=$|[)\s;|&])/,
            lookbehind: true
        },
        "file-descriptor": {
            pattern: /\B&\d\b/,
            alias: "important"
        },
        operator: {
            pattern: /\d?<>|>\||\+=|=[=~]?|!=?|<<[<-]?|[&\d]?>>|\d[<>]&?|[<>][&=]?|&[>&]?|\|[&|]?/,
            inside: {
                "file-descriptor": {
                    pattern: /^\d/,
                    alias: "important"
                }
            }
        },
        punctuation: /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
        number: {
            pattern: /(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/,
            lookbehind: true
        }
    };
    commandAfterHeredoc.inside = Prism.languages.bash;
    var toBeCopied = [ "comment", "function-name", "for-or-select", "assign-left", "string", "environment", "function", "keyword", "builtin", "boolean", "file-descriptor", "operator", "punctuation", "number" ];
    var inside = insideString.variable[1].inside;
    for (var i = 0; i < toBeCopied.length; i++) {
        inside[toBeCopied[i]] = Prism.languages.bash[toBeCopied[i]];
    }
    Prism.languages.shell = Prism.languages.bash;
})(Prism);

Prism.languages.basic = {
    comment: {
        pattern: /(?:!|REM\b).+/i,
        inside: {
            keyword: /^REM/i
        }
    },
    string: {
        pattern: /"(?:""|[!#$%&'()*,\/:;<=>?^\w +\-.])*"/,
        greedy: true
    },
    number: /(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:E[+-]?\d+)?/i,
    keyword: /\b(?:AS|BEEP|BLOAD|BSAVE|CALL(?: ABSOLUTE)?|CASE|CHAIN|CHDIR|CLEAR|CLOSE|CLS|COM|COMMON|CONST|DATA|DECLARE|DEF(?: FN| SEG|DBL|INT|LNG|SNG|STR)|DIM|DO|DOUBLE|ELSE|ELSEIF|END|ENVIRON|ERASE|ERROR|EXIT|FIELD|FILES|FOR|FUNCTION|GET|GOSUB|GOTO|IF|INPUT|INTEGER|IOCTL|KEY|KILL|LINE INPUT|LOCATE|LOCK|LONG|LOOP|LSET|MKDIR|NAME|NEXT|OFF|ON(?: COM| ERROR| KEY| TIMER)?|OPEN|OPTION BASE|OUT|POKE|PUT|READ|REDIM|REM|RESTORE|RESUME|RETURN|RMDIR|RSET|RUN|SELECT CASE|SHARED|SHELL|SINGLE|SLEEP|STATIC|STEP|STOP|STRING|SUB|SWAP|SYSTEM|THEN|TIMER|TO|TROFF|TRON|TYPE|UNLOCK|UNTIL|USING|VIEW PRINT|WAIT|WEND|WHILE|WRITE)(?:\$|\b)/i,
    function: /\b(?:ABS|ACCESS|ACOS|ANGLE|AREA|ARITHMETIC|ARRAY|ASIN|ASK|AT|ATN|BASE|BEGIN|BREAK|CAUSE|CEIL|CHR|CLIP|COLLATE|COLOR|CON|COS|COSH|COT|CSC|DATE|DATUM|DEBUG|DECIMAL|DEF|DEG|DEGREES|DELETE|DET|DEVICE|DISPLAY|DOT|ELAPSED|EPS|ERASABLE|EXLINE|EXP|EXTERNAL|EXTYPE|FILETYPE|FIXED|FP|GO|GRAPH|HANDLER|IDN|IMAGE|IN|INT|INTERNAL|IP|IS|KEYED|LBOUND|LCASE|LEFT|LEN|LENGTH|LET|LINE|LINES|LOG|LOG10|LOG2|LTRIM|MARGIN|MAT|MAX|MAXNUM|MID|MIN|MISSING|MOD|NATIVE|NUL|NUMERIC|OF|OPTION|ORD|ORGANIZATION|OUTIN|OUTPUT|PI|POINT|POINTER|POINTS|POS|PRINT|PROGRAM|PROMPT|RAD|RADIANS|RANDOMIZE|RECORD|RECSIZE|RECTYPE|RELATIVE|REMAINDER|REPEAT|REST|RETRY|REWRITE|RIGHT|RND|ROUND|RTRIM|SAME|SEC|SELECT|SEQUENTIAL|SET|SETTER|SGN|SIN|SINH|SIZE|SKIP|SQR|STANDARD|STATUS|STR|STREAM|STYLE|TAB|TAN|TANH|TEMPLATE|TEXT|THERE|TIME|TIMEOUT|TRACE|TRANSFORM|TRUNCATE|UBOUND|UCASE|USE|VAL|VARIABLE|VIEWPORT|WHEN|WINDOW|WITH|ZER|ZONEWIDTH)(?:\$|\b)/i,
    operator: /<[=>]?|>=?|[+\-*\/^=&]|\b(?:AND|EQV|IMP|NOT|OR|XOR)\b/i,
    punctuation: /[,;:()]/
};

Prism.languages.c = Prism.languages.extend("clike", {
    comment: {
        pattern: /\/\/(?:[^\r\n\\]|\\(?:\r\n?|\n|(?![\r\n])))*|\/\*[\s\S]*?(?:\*\/|$)/,
        greedy: true
    },
    string: {
        pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
        greedy: true
    },
    "class-name": {
        pattern: /(\b(?:enum|struct)\s+(?:__attribute__\s*\(\([\s\S]*?\)\)\s*)?)\w+|\b[a-z]\w*_t\b/,
        lookbehind: true
    },
    keyword: /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|__attribute__|asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|typeof|union|unsigned|void|volatile|while)\b/,
    function: /\b[a-z_]\w*(?=\s*\()/i,
    number: /(?:\b0x(?:[\da-f]+(?:\.[\da-f]*)?|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)[ful]{0,4}/i,
    operator: />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/
});

Prism.languages.insertBefore("c", "string", {
    char: {
        pattern: /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n]){0,32}'/,
        greedy: true
    }
});

Prism.languages.insertBefore("c", "string", {
    macro: {
        pattern: /(^[\t ]*)#\s*[a-z](?:[^\r\n\\/]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|\\(?:\r\n|[\s\S]))*/im,
        lookbehind: true,
        greedy: true,
        alias: "property",
        inside: {
            string: [ {
                pattern: /^(#\s*include\s*)<[^>]+>/,
                lookbehind: true
            }, Prism.languages.c["string"] ],
            char: Prism.languages.c["char"],
            comment: Prism.languages.c["comment"],
            "macro-name": [ {
                pattern: /(^#\s*define\s+)\w+\b(?!\()/i,
                lookbehind: true
            }, {
                pattern: /(^#\s*define\s+)\w+\b(?=\()/i,
                lookbehind: true,
                alias: "function"
            } ],
            directive: {
                pattern: /^(#\s*)[a-z]+/,
                lookbehind: true,
                alias: "keyword"
            },
            "directive-hash": /^#/,
            punctuation: /##|\\(?=[\r\n])/,
            expression: {
                pattern: /\S[\s\S]*/,
                inside: Prism.languages.c
            }
        }
    }
});

Prism.languages.insertBefore("c", "function", {
    constant: /\b(?:EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|__DATE__|__FILE__|__LINE__|__TIMESTAMP__|__TIME__|__func__|stderr|stdin|stdout)\b/
});

delete Prism.languages.c["boolean"];

(function(Prism) {
    var keyword = /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|char8_t|class|co_await|co_return|co_yield|compl|concept|const|const_cast|consteval|constexpr|constinit|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|final|float|for|friend|goto|if|import|inline|int|int16_t|int32_t|int64_t|int8_t|long|module|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|uint16_t|uint32_t|uint64_t|uint8_t|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/;
    var modName = /\b(?!<keyword>)\w+(?:\s*\.\s*\w+)*\b/.source.replace(/<keyword>/g, function() {
        return keyword.source;
    });
    Prism.languages.cpp = Prism.languages.extend("c", {
        "class-name": [ {
            pattern: RegExp(/(\b(?:class|concept|enum|struct|typename)\s+)(?!<keyword>)\w+/.source.replace(/<keyword>/g, function() {
                return keyword.source;
            })),
            lookbehind: true
        }, /\b[A-Z]\w*(?=\s*::\s*\w+\s*\()/, /\b[A-Z_]\w*(?=\s*::\s*~\w+\s*\()/i, /\b\w+(?=\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>\s*::\s*\w+\s*\()/ ],
        keyword: keyword,
        number: {
            pattern: /(?:\b0b[01']+|\b0x(?:[\da-f']+(?:\.[\da-f']*)?|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+(?:\.[\d']*)?|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]{0,4}/i,
            greedy: true
        },
        operator: />>=?|<<=?|->|--|\+\+|&&|\|\||[?:~]|<=>|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/,
        boolean: /\b(?:false|true)\b/
    });
    Prism.languages.insertBefore("cpp", "string", {
        module: {
            pattern: RegExp(/(\b(?:import|module)\s+)/.source + "(?:" + /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|<[^<>\r\n]*>/.source + "|" + /<mod-name>(?:\s*:\s*<mod-name>)?|:\s*<mod-name>/.source.replace(/<mod-name>/g, function() {
                return modName;
            }) + ")"),
            lookbehind: true,
            greedy: true,
            inside: {
                string: /^[<"][\s\S]+/,
                operator: /:/,
                punctuation: /\./
            }
        },
        "raw-string": {
            pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,
            alias: "string",
            greedy: true
        }
    });
    Prism.languages.insertBefore("cpp", "keyword", {
        "generic-function": {
            pattern: /\b(?!operator\b)[a-z_]\w*\s*<(?:[^<>]|<[^<>]*>)*>(?=\s*\()/i,
            inside: {
                function: /^\w+/,
                generic: {
                    pattern: /<[\s\S]+/,
                    alias: "class-name",
                    inside: Prism.languages.cpp
                }
            }
        }
    });
    Prism.languages.insertBefore("cpp", "operator", {
        "double-colon": {
            pattern: /::/,
            alias: "punctuation"
        }
    });
    Prism.languages.insertBefore("cpp", "class-name", {
        "base-clause": {
            pattern: /(\b(?:class|struct)\s+\w+\s*:\s*)[^;{}"'\s]+(?:\s+[^;{}"'\s]+)*(?=\s*[;{])/,
            lookbehind: true,
            greedy: true,
            inside: Prism.languages.extend("cpp", {})
        }
    });
    Prism.languages.insertBefore("inside", "double-colon", {
        "class-name": /\b[a-z_]\w*\b(?!\s*::)/i
    }, Prism.languages.cpp["base-clause"]);
})(Prism);

(function(Prism) {
    var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;
    var selectorInside;
    Prism.languages.css.selector = {
        pattern: Prism.languages.css.selector.pattern,
        lookbehind: true,
        inside: selectorInside = {
            "pseudo-element": /:(?:after|before|first-letter|first-line|selection)|::[-\w]+/,
            "pseudo-class": /:[-\w]+/,
            class: /\.[-\w]+/,
            id: /#[-\w]+/,
            attribute: {
                pattern: RegExp("\\[(?:[^[\\]\"']|" + string.source + ")*\\]"),
                greedy: true,
                inside: {
                    punctuation: /^\[|\]$/,
                    "case-sensitivity": {
                        pattern: /(\s)[si]$/i,
                        lookbehind: true,
                        alias: "keyword"
                    },
                    namespace: {
                        pattern: /^(\s*)(?:(?!\s)[-*\w\xA0-\uFFFF])*\|(?!=)/,
                        lookbehind: true,
                        inside: {
                            punctuation: /\|$/
                        }
                    },
                    "attr-name": {
                        pattern: /^(\s*)(?:(?!\s)[-\w\xA0-\uFFFF])+/,
                        lookbehind: true
                    },
                    "attr-value": [ string, {
                        pattern: /(=\s*)(?:(?!\s)[-\w\xA0-\uFFFF])+(?=\s*$)/,
                        lookbehind: true
                    } ],
                    operator: /[|~*^$]?=/
                }
            },
            "n-th": [ {
                pattern: /(\(\s*)[+-]?\d*[\dn](?:\s*[+-]\s*\d+)?(?=\s*\))/,
                lookbehind: true,
                inside: {
                    number: /[\dn]+/,
                    operator: /[+-]/
                }
            }, {
                pattern: /(\(\s*)(?:even|odd)(?=\s*\))/i,
                lookbehind: true
            } ],
            combinator: />|\+|~|\|\|/,
            punctuation: /[(),]/
        }
    };
    Prism.languages.css["atrule"].inside["selector-function-argument"].inside = selectorInside;
    Prism.languages.insertBefore("css", "property", {
        variable: {
            pattern: /(^|[^-\w\xA0-\uFFFF])--(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*/i,
            lookbehind: true
        }
    });
    var unit = {
        pattern: /(\b\d+)(?:%|[a-z]+(?![\w-]))/,
        lookbehind: true
    };
    var number = {
        pattern: /(^|[^\w.-])-?(?:\d+(?:\.\d+)?|\.\d+)/,
        lookbehind: true
    };
    Prism.languages.insertBefore("css", "function", {
        operator: {
            pattern: /(\s)[+\-*\/](?=\s)/,
            lookbehind: true
        },
        hexcode: {
            pattern: /\B#[\da-f]{3,8}\b/i,
            alias: "color"
        },
        color: [ {
            pattern: /(^|[^\w-])(?:AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGr[ae]y|DarkGreen|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrange|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGr[ae]y|DarkTurquoise|DarkViolet|DeepPink|DeepSkyBlue|DimGr[ae]y|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gr[ae]y|Green|GreenYellow|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGr[ae]y|LightGreen|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGr[ae]y|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGr[ae]y|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Transparent|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen)(?![\w-])/i,
            lookbehind: true
        }, {
            pattern: /\b(?:hsl|rgb)\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*\)\B|\b(?:hsl|rgb)a\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*(?:0|0?\.\d+|1)\s*\)\B/i,
            inside: {
                unit: unit,
                number: number,
                function: /[\w-]+(?=\()/,
                punctuation: /[(),]/
            }
        } ],
        entity: /\\[\da-f]{1,8}/i,
        unit: unit,
        number: number
    });
})(Prism);

Prism.languages.git = {
    comment: /^#.*/m,
    deleted: /^[-–].*/m,
    inserted: /^\+.*/m,
    string: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
    command: {
        pattern: /^.*\$ git .*$/m,
        inside: {
            parameter: /\s--?\w+/
        }
    },
    coord: /^@@.*@@$/m,
    "commit-sha1": /^commit \w{40}$/m
};

(function(Prism) {
    var keywords = /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|non-sealed|null|open|opens|package|permits|private|protected|provides|public|record(?!\s*[(){}[\]<>=%~.:,;?+\-*/&|^])|requires|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/;
    var classNamePrefix = /(?:[a-z]\w*\s*\.\s*)*(?:[A-Z]\w*\s*\.\s*)*/.source;
    var className = {
        pattern: RegExp(/(^|[^\w.])/.source + classNamePrefix + /[A-Z](?:[\d_A-Z]*[a-z]\w*)?\b/.source),
        lookbehind: true,
        inside: {
            namespace: {
                pattern: /^[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.)?/,
                inside: {
                    punctuation: /\./
                }
            },
            punctuation: /\./
        }
    };
    Prism.languages.java = Prism.languages.extend("clike", {
        string: {
            pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"/,
            lookbehind: true,
            greedy: true
        },
        "class-name": [ className, {
            pattern: RegExp(/(^|[^\w.])/.source + classNamePrefix + /[A-Z]\w*(?=\s+\w+\s*[;,=()]|\s*(?:\[[\s,]*\]\s*)?::\s*new\b)/.source),
            lookbehind: true,
            inside: className.inside
        }, {
            pattern: RegExp(/(\b(?:class|enum|extends|implements|instanceof|interface|new|record|throws)\s+)/.source + classNamePrefix + /[A-Z]\w*\b/.source),
            lookbehind: true,
            inside: className.inside
        } ],
        keyword: keywords,
        function: [ Prism.languages.clike.function, {
            pattern: /(::\s*)[a-z_]\w*/,
            lookbehind: true
        } ],
        number: /\b0b[01][01_]*L?\b|\b0x(?:\.[\da-f_p+-]+|[\da-f_]+(?:\.[\da-f_p+-]+)?)\b|(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
        operator: {
            pattern: /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
            lookbehind: true
        }
    });
    Prism.languages.insertBefore("java", "string", {
        "triple-quoted-string": {
            pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/,
            greedy: true,
            alias: "string"
        },
        char: {
            pattern: /'(?:\\.|[^'\\\r\n]){1,6}'/,
            greedy: true
        }
    });
    Prism.languages.insertBefore("java", "class-name", {
        annotation: {
            pattern: /(^|[^.])@\w+(?:\s*\.\s*\w+)*/,
            lookbehind: true,
            alias: "punctuation"
        },
        generics: {
            pattern: /<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&))*>)*>)*>)*>/,
            inside: {
                "class-name": className,
                keyword: keywords,
                punctuation: /[<>(),.:]/,
                operator: /[?&|]/
            }
        },
        import: [ {
            pattern: RegExp(/(\bimport\s+)/.source + classNamePrefix + /(?:[A-Z]\w*|\*)(?=\s*;)/.source),
            lookbehind: true,
            inside: {
                namespace: className.inside.namespace,
                punctuation: /\./,
                operator: /\*/,
                "class-name": /\w+/
            }
        }, {
            pattern: RegExp(/(\bimport\s+static\s+)/.source + classNamePrefix + /(?:\w+|\*)(?=\s*;)/.source),
            lookbehind: true,
            alias: "static",
            inside: {
                namespace: className.inside.namespace,
                static: /\b\w+$/,
                punctuation: /\./,
                operator: /\*/,
                "class-name": /\w+/
            }
        } ],
        namespace: {
            pattern: RegExp(/(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)(?!<keyword>)[a-z]\w*(?:\.[a-z]\w*)*\.?/.source.replace(/<keyword>/g, function() {
                return keywords.source;
            })),
            lookbehind: true,
            inside: {
                punctuation: /\./
            }
        }
    });
})(Prism);

Prism.languages.python = {
    comment: {
        pattern: /(^|[^\\])#.*/,
        lookbehind: true,
        greedy: true
    },
    "string-interpolation": {
        pattern: /(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
        greedy: true,
        inside: {
            interpolation: {
                pattern: /((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/,
                lookbehind: true,
                inside: {
                    "format-spec": {
                        pattern: /(:)[^:(){}]+(?=\}$)/,
                        lookbehind: true
                    },
                    "conversion-option": {
                        pattern: /![sra](?=[:}]$)/,
                        alias: "punctuation"
                    },
                    rest: null
                }
            },
            string: /[\s\S]+/
        }
    },
    "triple-quoted-string": {
        pattern: /(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i,
        greedy: true,
        alias: "string"
    },
    string: {
        pattern: /(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
        greedy: true
    },
    function: {
        pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
        lookbehind: true
    },
    "class-name": {
        pattern: /(\bclass\s+)\w+/i,
        lookbehind: true
    },
    decorator: {
        pattern: /(^[\t ]*)@\w+(?:\.\w+)*/m,
        lookbehind: true,
        alias: [ "annotation", "punctuation" ],
        inside: {
            punctuation: /\./
        }
    },
    keyword: /\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
    builtin: /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
    boolean: /\b(?:False|None|True)\b/,
    number: /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,
    operator: /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
    punctuation: /[{}[\];(),.:]/
};

Prism.languages.python["string-interpolation"].inside["interpolation"].inside.rest = Prism.languages.python;

Prism.languages.py = Prism.languages.python;

Prism.languages.scss = Prism.languages.extend("css", {
    comment: {
        pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
        lookbehind: true
    },
    atrule: {
        pattern: /@[\w-](?:\([^()]+\)|[^()\s]|\s+(?!\s))*?(?=\s+[{;])/,
        inside: {
            rule: /@[\w-]+/
        }
    },
    url: /(?:[-a-z]+-)?url(?=\()/i,
    selector: {
        pattern: /(?=\S)[^@;{}()]?(?:[^@;{}()\s]|\s+(?!\s)|#\{\$[-\w]+\})+(?=\s*\{(?:\}|\s|[^}][^:{}]*[:{][^}]))/,
        inside: {
            parent: {
                pattern: /&/,
                alias: "important"
            },
            placeholder: /%[-\w]+/,
            variable: /\$[-\w]+|#\{\$[-\w]+\}/
        }
    },
    property: {
        pattern: /(?:[-\w]|\$[-\w]|#\{\$[-\w]+\})+(?=\s*:)/,
        inside: {
            variable: /\$[-\w]+|#\{\$[-\w]+\}/
        }
    }
});

Prism.languages.insertBefore("scss", "atrule", {
    keyword: [ /@(?:content|debug|each|else(?: if)?|extend|for|forward|function|if|import|include|mixin|return|use|warn|while)\b/i, {
        pattern: /( )(?:from|through)(?= )/,
        lookbehind: true
    } ]
});

Prism.languages.insertBefore("scss", "important", {
    variable: /\$[-\w]+|#\{\$[-\w]+\}/
});

Prism.languages.insertBefore("scss", "function", {
    "module-modifier": {
        pattern: /\b(?:as|hide|show|with)\b/i,
        alias: "keyword"
    },
    placeholder: {
        pattern: /%[-\w]+/,
        alias: "selector"
    },
    statement: {
        pattern: /\B!(?:default|optional)\b/i,
        alias: "keyword"
    },
    boolean: /\b(?:false|true)\b/,
    null: {
        pattern: /\bnull\b/,
        alias: "keyword"
    },
    operator: {
        pattern: /(\s)(?:[-+*\/%]|[=!]=|<=?|>=?|and|not|or)(?=\s)/,
        lookbehind: true
    }
});

Prism.languages.scss["atrule"].inside.rest = Prism.languages.scss;

Prism.languages.sql = {
    comment: {
        pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
        lookbehind: true
    },
    variable: [ {
        pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,
        greedy: true
    }, /@[\w.$]+/ ],
    string: {
        pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
        greedy: true,
        lookbehind: true
    },
    identifier: {
        pattern: /(^|[^@\\])`(?:\\[\s\S]|[^`\\]|``)*`/,
        greedy: true,
        lookbehind: true,
        inside: {
            punctuation: /^`|`$/
        }
    },
    function: /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i,
    keyword: /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:COL|_INSERT)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:ING|S)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,
    boolean: /\b(?:FALSE|NULL|TRUE)\b/i,
    number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i,
    operator: /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|ILIKE|IN|IS|LIKE|NOT|OR|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,
    punctuation: /[;[\]()`,.]/
};

Prism.languages.vbnet = Prism.languages.extend("basic", {
    comment: [ {
        pattern: /(?:!|REM\b).+/i,
        inside: {
            keyword: /^REM/i
        }
    }, {
        pattern: /(^|[^\\:])'.*/,
        lookbehind: true,
        greedy: true
    } ],
    string: {
        pattern: /(^|[^"])"(?:""|[^"])*"(?!")/,
        lookbehind: true,
        greedy: true
    },
    keyword: /(?:\b(?:ADDHANDLER|ADDRESSOF|ALIAS|AND|ANDALSO|AS|BEEP|BLOAD|BOOLEAN|BSAVE|BYREF|BYTE|BYVAL|CALL(?: ABSOLUTE)?|CASE|CATCH|CBOOL|CBYTE|CCHAR|CDATE|CDBL|CDEC|CHAIN|CHAR|CHDIR|CINT|CLASS|CLEAR|CLNG|CLOSE|CLS|COBJ|COM|COMMON|CONST|CONTINUE|CSBYTE|CSHORT|CSNG|CSTR|CTYPE|CUINT|CULNG|CUSHORT|DATA|DATE|DECIMAL|DECLARE|DEF(?: FN| SEG|DBL|INT|LNG|SNG|STR)|DEFAULT|DELEGATE|DIM|DIRECTCAST|DO|DOUBLE|ELSE|ELSEIF|END|ENUM|ENVIRON|ERASE|ERROR|EVENT|EXIT|FALSE|FIELD|FILES|FINALLY|FOR(?: EACH)?|FRIEND|FUNCTION|GET|GETTYPE|GETXMLNAMESPACE|GLOBAL|GOSUB|GOTO|HANDLES|IF|IMPLEMENTS|IMPORTS|IN|INHERITS|INPUT|INTEGER|INTERFACE|IOCTL|IS|ISNOT|KEY|KILL|LET|LIB|LIKE|LINE INPUT|LOCATE|LOCK|LONG|LOOP|LSET|ME|MKDIR|MOD|MODULE|MUSTINHERIT|MUSTOVERRIDE|MYBASE|MYCLASS|NAME|NAMESPACE|NARROWING|NEW|NEXT|NOT|NOTHING|NOTINHERITABLE|NOTOVERRIDABLE|OBJECT|OF|OFF|ON(?: COM| ERROR| KEY| TIMER)?|OPEN|OPERATOR|OPTION(?: BASE)?|OPTIONAL|OR|ORELSE|OUT|OVERLOADS|OVERRIDABLE|OVERRIDES|PARAMARRAY|PARTIAL|POKE|PRIVATE|PROPERTY|PROTECTED|PUBLIC|PUT|RAISEEVENT|READ|READONLY|REDIM|REM|REMOVEHANDLER|RESTORE|RESUME|RETURN|RMDIR|RSET|RUN|SBYTE|SELECT(?: CASE)?|SET|SHADOWS|SHARED|SHELL|SHORT|SINGLE|SLEEP|STATIC|STEP|STOP|STRING|STRUCTURE|SUB|SWAP|SYNCLOCK|SYSTEM|THEN|THROW|TIMER|TO|TROFF|TRON|TRUE|TRY|TRYCAST|TYPE|TYPEOF|UINTEGER|ULONG|UNLOCK|UNTIL|USHORT|USING|VIEW PRINT|WAIT|WEND|WHEN|WHILE|WIDENING|WITH|WITHEVENTS|WRITE|WRITEONLY|XOR)|\B(?:#CONST|#ELSE|#ELSEIF|#END|#IF))(?:\$|\b)/i,
    punctuation: /[,;:(){}]/
});

Prism.languages["visual-basic"] = {
    comment: {
        pattern: /(?:['‘’]|REM\b)(?:[^\r\n_]|_(?:\r\n?|\n)?)*/i,
        inside: {
            keyword: /^REM/i
        }
    },
    directive: {
        pattern: /#(?:Const|Else|ElseIf|End|ExternalChecksum|ExternalSource|If|Region)(?:\b_[ \t]*(?:\r\n?|\n)|.)+/i,
        alias: "property",
        greedy: true
    },
    string: {
        pattern: /\$?["“”](?:["“”]{2}|[^"“”])*["“”]C?/i,
        greedy: true
    },
    date: {
        pattern: /#[ \t]*(?:\d+([/-])\d+\1\d+(?:[ \t]+(?:\d+[ \t]*(?:AM|PM)|\d+:\d+(?::\d+)?(?:[ \t]*(?:AM|PM))?))?|\d+[ \t]*(?:AM|PM)|\d+:\d+(?::\d+)?(?:[ \t]*(?:AM|PM))?)[ \t]*#/i,
        alias: "number"
    },
    number: /(?:(?:\b\d+(?:\.\d+)?|\.\d+)(?:E[+-]?\d+)?|&[HO][\dA-F]+)(?:[FRD]|U?[ILS])?/i,
    boolean: /\b(?:False|Nothing|True)\b/i,
    keyword: /\b(?:AddHandler|AddressOf|Alias|And(?:Also)?|As|Boolean|ByRef|Byte|ByVal|Call|Case|Catch|C(?:Bool|Byte|Char|Date|Dbl|Dec|Int|Lng|Obj|SByte|Short|Sng|Str|Type|UInt|ULng|UShort)|Char|Class|Const|Continue|Currency|Date|Decimal|Declare|Default|Delegate|Dim|DirectCast|Do|Double|Each|Else(?:If)?|End(?:If)?|Enum|Erase|Error|Event|Exit|Finally|For|Friend|Function|Get(?:Type|XMLNamespace)?|Global|GoSub|GoTo|Handles|If|Implements|Imports|In|Inherits|Integer|Interface|Is|IsNot|Let|Lib|Like|Long|Loop|Me|Mod|Module|Must(?:Inherit|Override)|My(?:Base|Class)|Namespace|Narrowing|New|Next|Not(?:Inheritable|Overridable)?|Object|Of|On|Operator|Option(?:al)?|Or(?:Else)?|Out|Overloads|Overridable|Overrides|ParamArray|Partial|Private|Property|Protected|Public|RaiseEvent|ReadOnly|ReDim|RemoveHandler|Resume|Return|SByte|Select|Set|Shadows|Shared|short|Single|Static|Step|Stop|String|Structure|Sub|SyncLock|Then|Throw|To|Try|TryCast|Type|TypeOf|U(?:Integer|Long|Short)|Until|Using|Variant|Wend|When|While|Widening|With(?:Events)?|WriteOnly|Xor)\b/i,
    operator: /[+\-*/\\^<=>&#@$%!]|\b_(?=[ \t]*[\r\n])/,
    punctuation: /[{}().,:?]/
};

Prism.languages.vb = Prism.languages["visual-basic"];

Prism.languages.vba = Prism.languages["visual-basic"];

(function() {
    if (typeof Prism === "undefined" || typeof document === "undefined" || !document.querySelector) {
        return;
    }
    var LINE_NUMBERS_CLASS = "line-numbers";
    var LINKABLE_LINE_NUMBERS_CLASS = "linkable-line-numbers";
    function $$(selector, container) {
        return Array.prototype.slice.call((container || document).querySelectorAll(selector));
    }
    function hasClass(element, className) {
        return element.classList.contains(className);
    }
    function callFunction(func) {
        func();
    }
    var isLineHeightRounded = function() {
        var res;
        return function() {
            if (typeof res === "undefined") {
                var d = document.createElement("div");
                d.style.fontSize = "13px";
                d.style.lineHeight = "1.5";
                d.style.padding = "0";
                d.style.border = "0";
                d.innerHTML = "&nbsp;<br />&nbsp;";
                document.body.appendChild(d);
                res = d.offsetHeight === 38;
                document.body.removeChild(d);
            }
            return res;
        };
    }();
    function getContentBoxTopOffset(parent, child) {
        var parentStyle = getComputedStyle(parent);
        var childStyle = getComputedStyle(child);
        function pxToNumber(px) {
            return +px.substr(0, px.length - 2);
        }
        return child.offsetTop + pxToNumber(childStyle.borderTopWidth) + pxToNumber(childStyle.paddingTop) - pxToNumber(parentStyle.paddingTop);
    }
    function isActiveFor(pre) {
        if (!pre || !/pre/i.test(pre.nodeName)) {
            return false;
        }
        if (pre.hasAttribute("data-line")) {
            return true;
        }
        if (pre.id && Prism.util.isActive(pre, LINKABLE_LINE_NUMBERS_CLASS)) {
            return true;
        }
        return false;
    }
    var scrollIntoView = true;
    Prism.plugins.lineHighlight = {
        highlightLines: function highlightLines(pre, lines, classes) {
            lines = typeof lines === "string" ? lines : pre.getAttribute("data-line") || "";
            var ranges = lines.replace(/\s+/g, "").split(",").filter(Boolean);
            var offset = +pre.getAttribute("data-line-offset") || 0;
            var parseMethod = isLineHeightRounded() ? parseInt : parseFloat;
            var lineHeight = parseMethod(getComputedStyle(pre).lineHeight);
            var hasLineNumbers = Prism.util.isActive(pre, LINE_NUMBERS_CLASS);
            var codeElement = pre.querySelector("code");
            var parentElement = hasLineNumbers ? pre : codeElement || pre;
            var mutateActions = [];
            var codePreOffset = !codeElement || parentElement == codeElement ? 0 : getContentBoxTopOffset(pre, codeElement);
            ranges.forEach(function(currentRange) {
                var range = currentRange.split("-");
                var start = +range[0];
                var end = +range[1] || start;
                var line = pre.querySelector('.line-highlight[data-range="' + currentRange + '"]') || document.createElement("div");
                mutateActions.push(function() {
                    line.setAttribute("aria-hidden", "true");
                    line.setAttribute("data-range", currentRange);
                    line.className = (classes || "") + " line-highlight";
                });
                if (hasLineNumbers && Prism.plugins.lineNumbers) {
                    var startNode = Prism.plugins.lineNumbers.getLine(pre, start);
                    var endNode = Prism.plugins.lineNumbers.getLine(pre, end);
                    if (startNode) {
                        var top = startNode.offsetTop + codePreOffset + "px";
                        mutateActions.push(function() {
                            line.style.top = top;
                        });
                    }
                    if (endNode) {
                        var height = endNode.offsetTop - startNode.offsetTop + endNode.offsetHeight + "px";
                        mutateActions.push(function() {
                            line.style.height = height;
                        });
                    }
                } else {
                    mutateActions.push(function() {
                        line.setAttribute("data-start", String(start));
                        if (end > start) {
                            line.setAttribute("data-end", String(end));
                        }
                        line.style.top = (start - offset - 1) * lineHeight + codePreOffset + "px";
                        line.textContent = new Array(end - start + 2).join(" \n");
                    });
                }
                mutateActions.push(function() {
                    line.style.width = pre.scrollWidth + "px";
                });
                mutateActions.push(function() {
                    parentElement.appendChild(line);
                });
            });
            var id = pre.id;
            if (hasLineNumbers && Prism.util.isActive(pre, LINKABLE_LINE_NUMBERS_CLASS) && id) {
                if (!hasClass(pre, LINKABLE_LINE_NUMBERS_CLASS)) {
                    mutateActions.push(function() {
                        pre.classList.add(LINKABLE_LINE_NUMBERS_CLASS);
                    });
                }
                var start = parseInt(pre.getAttribute("data-start") || "1");
                $$(".line-numbers-rows > span", pre).forEach(function(lineSpan, i) {
                    var lineNumber = i + start;
                    lineSpan.onclick = function() {
                        var hash = id + "." + lineNumber;
                        scrollIntoView = false;
                        location.hash = hash;
                        setTimeout(function() {
                            scrollIntoView = true;
                        }, 1);
                    };
                });
            }
            return function() {
                mutateActions.forEach(callFunction);
            };
        }
    };
    function applyHash() {
        var hash = location.hash.slice(1);
        $$(".temporary.line-highlight").forEach(function(line) {
            line.parentNode.removeChild(line);
        });
        var range = (hash.match(/\.([\d,-]+)$/) || [ , "" ])[1];
        if (!range || document.getElementById(hash)) {
            return;
        }
        var id = hash.slice(0, hash.lastIndexOf("."));
        var pre = document.getElementById(id);
        if (!pre) {
            return;
        }
        if (!pre.hasAttribute("data-line")) {
            pre.setAttribute("data-line", "");
        }
        var mutateDom = Prism.plugins.lineHighlight.highlightLines(pre, range, "temporary ");
        mutateDom();
        if (scrollIntoView) {
            document.querySelector(".temporary.line-highlight").scrollIntoView();
        }
    }
    var fakeTimer = 0;
    Prism.hooks.add("before-sanity-check", function(env) {
        var pre = env.element.parentElement;
        if (!isActiveFor(pre)) {
            return;
        }
        var num = 0;
        $$(".line-highlight", pre).forEach(function(line) {
            num += line.textContent.length;
            line.parentNode.removeChild(line);
        });
        if (num && /^(?: \n)+$/.test(env.code.slice(-num))) {
            env.code = env.code.slice(0, -num);
        }
    });
    Prism.hooks.add("complete", function completeHook(env) {
        var pre = env.element.parentElement;
        if (!isActiveFor(pre)) {
            return;
        }
        clearTimeout(fakeTimer);
        var hasLineNumbers = Prism.plugins.lineNumbers;
        var isLineNumbersLoaded = env.plugins && env.plugins.lineNumbers;
        if (hasClass(pre, LINE_NUMBERS_CLASS) && hasLineNumbers && !isLineNumbersLoaded) {
            Prism.hooks.add("line-numbers", completeHook);
        } else {
            var mutateDom = Prism.plugins.lineHighlight.highlightLines(pre);
            mutateDom();
            fakeTimer = setTimeout(applyHash, 1);
        }
    });
    window.addEventListener("hashchange", applyHash);
    window.addEventListener("resize", function() {
        var actions = $$("pre").filter(isActiveFor).map(function(pre) {
            return Prism.plugins.lineHighlight.highlightLines(pre);
        });
        actions.forEach(callFunction);
    });
})();

(function() {
    if (typeof Prism === "undefined" || typeof document === "undefined") {
        return;
    }
    var PLUGIN_NAME = "line-numbers";
    var NEW_LINE_EXP = /\n(?!$)/g;
    var config = Prism.plugins.lineNumbers = {
        getLine: function(element, number) {
            if (element.tagName !== "PRE" || !element.classList.contains(PLUGIN_NAME)) {
                return;
            }
            var lineNumberRows = element.querySelector(".line-numbers-rows");
            if (!lineNumberRows) {
                return;
            }
            var lineNumberStart = parseInt(element.getAttribute("data-start"), 10) || 1;
            var lineNumberEnd = lineNumberStart + (lineNumberRows.children.length - 1);
            if (number < lineNumberStart) {
                number = lineNumberStart;
            }
            if (number > lineNumberEnd) {
                number = lineNumberEnd;
            }
            var lineIndex = number - lineNumberStart;
            return lineNumberRows.children[lineIndex];
        },
        resize: function(element) {
            resizeElements([ element ]);
        },
        assumeViewportIndependence: true
    };
    function resizeElements(elements) {
        elements = elements.filter(function(e) {
            var codeStyles = getStyles(e);
            var whiteSpace = codeStyles["white-space"];
            return whiteSpace === "pre-wrap" || whiteSpace === "pre-line";
        });
        if (elements.length == 0) {
            return;
        }
        var infos = elements.map(function(element) {
            var codeElement = element.querySelector("code");
            var lineNumbersWrapper = element.querySelector(".line-numbers-rows");
            if (!codeElement || !lineNumbersWrapper) {
                return undefined;
            }
            var lineNumberSizer = element.querySelector(".line-numbers-sizer");
            var codeLines = codeElement.textContent.split(NEW_LINE_EXP);
            if (!lineNumberSizer) {
                lineNumberSizer = document.createElement("span");
                lineNumberSizer.className = "line-numbers-sizer";
                codeElement.appendChild(lineNumberSizer);
            }
            lineNumberSizer.innerHTML = "0";
            lineNumberSizer.style.display = "block";
            var oneLinerHeight = lineNumberSizer.getBoundingClientRect().height;
            lineNumberSizer.innerHTML = "";
            return {
                element: element,
                lines: codeLines,
                lineHeights: [],
                oneLinerHeight: oneLinerHeight,
                sizer: lineNumberSizer
            };
        }).filter(Boolean);
        infos.forEach(function(info) {
            var lineNumberSizer = info.sizer;
            var lines = info.lines;
            var lineHeights = info.lineHeights;
            var oneLinerHeight = info.oneLinerHeight;
            lineHeights[lines.length - 1] = undefined;
            lines.forEach(function(line, index) {
                if (line && line.length > 1) {
                    var e = lineNumberSizer.appendChild(document.createElement("span"));
                    e.style.display = "block";
                    e.textContent = line;
                } else {
                    lineHeights[index] = oneLinerHeight;
                }
            });
        });
        infos.forEach(function(info) {
            var lineNumberSizer = info.sizer;
            var lineHeights = info.lineHeights;
            var childIndex = 0;
            for (var i = 0; i < lineHeights.length; i++) {
                if (lineHeights[i] === undefined) {
                    lineHeights[i] = lineNumberSizer.children[childIndex++].getBoundingClientRect().height;
                }
            }
        });
        infos.forEach(function(info) {
            var lineNumberSizer = info.sizer;
            var wrapper = info.element.querySelector(".line-numbers-rows");
            lineNumberSizer.style.display = "none";
            lineNumberSizer.innerHTML = "";
            info.lineHeights.forEach(function(height, lineNumber) {
                wrapper.children[lineNumber].style.height = height + "px";
            });
        });
    }
    function getStyles(element) {
        if (!element) {
            return null;
        }
        return window.getComputedStyle ? getComputedStyle(element) : element.currentStyle || null;
    }
    var lastWidth = undefined;
    window.addEventListener("resize", function() {
        if (config.assumeViewportIndependence && lastWidth === window.innerWidth) {
            return;
        }
        lastWidth = window.innerWidth;
        resizeElements(Array.prototype.slice.call(document.querySelectorAll("pre." + PLUGIN_NAME)));
    });
    Prism.hooks.add("complete", function(env) {
        if (!env.code) {
            return;
        }
        var code = env.element;
        var pre = code.parentNode;
        if (!pre || !/pre/i.test(pre.nodeName)) {
            return;
        }
        if (code.querySelector(".line-numbers-rows")) {
            return;
        }
        if (!Prism.util.isActive(code, PLUGIN_NAME)) {
            return;
        }
        code.classList.remove(PLUGIN_NAME);
        pre.classList.add(PLUGIN_NAME);
        var match = env.code.match(NEW_LINE_EXP);
        var linesNum = match ? match.length + 1 : 1;
        var lineNumbersWrapper;
        var lines = new Array(linesNum + 1).join("<span></span>");
        lineNumbersWrapper = document.createElement("span");
        lineNumbersWrapper.setAttribute("aria-hidden", "true");
        lineNumbersWrapper.className = "line-numbers-rows";
        lineNumbersWrapper.innerHTML = lines;
        if (pre.hasAttribute("data-start")) {
            pre.style.counterReset = "linenumber " + (parseInt(pre.getAttribute("data-start"), 10) - 1);
        }
        env.element.appendChild(lineNumbersWrapper);
        resizeElements([ pre ]);
        Prism.hooks.run("line-numbers", env);
    });
    Prism.hooks.add("line-numbers", function(env) {
        env.plugins = env.plugins || {};
        env.plugins.lineNumbers = true;
    });
})();

(function() {
    if (typeof Prism === "undefined") {
        return;
    }
    var url = /\b([a-z]{3,7}:\/\/|tel:)[\w\-+%~/.:=&!$'()*,;@]+(?:\?[\w\-+%~/.:=?&!$'()*,;@]*)?(?:#[\w\-+%~/.:#=?&!$'()*,;@]*)?/;
    var email = /\b\S+@[\w.]+[a-z]{2}/;
    var linkMd = /\[([^\]]+)\]\(([^)]+)\)/;
    var candidates = [ "comment", "url", "attr-value", "string" ];
    Prism.plugins.autolinker = {
        processGrammar: function(grammar) {
            if (!grammar || grammar["url-link"]) {
                return;
            }
            Prism.languages.DFS(grammar, function(key, def, type) {
                if (candidates.indexOf(type) > -1 && !Array.isArray(def)) {
                    if (!def.pattern) {
                        def = this[key] = {
                            pattern: def
                        };
                    }
                    def.inside = def.inside || {};
                    if (type == "comment") {
                        def.inside["md-link"] = linkMd;
                    }
                    if (type == "attr-value") {
                        Prism.languages.insertBefore("inside", "punctuation", {
                            "url-link": url
                        }, def);
                    } else {
                        def.inside["url-link"] = url;
                    }
                    def.inside["email-link"] = email;
                }
            });
            grammar["url-link"] = url;
            grammar["email-link"] = email;
        }
    };
    Prism.hooks.add("before-highlight", function(env) {
        Prism.plugins.autolinker.processGrammar(env.grammar);
    });
    Prism.hooks.add("wrap", function(env) {
        if (/-link$/.test(env.type)) {
            env.tag = "a";
            var href = env.content;
            if (env.type == "email-link" && href.indexOf("mailto:") != 0) {
                href = "mailto:" + href;
            } else if (env.type == "md-link") {
                var match = env.content.match(linkMd);
                href = match[2];
                env.content = match[1];
            }
            env.attributes.href = href;
            try {
                env.content = decodeURIComponent(env.content);
            } catch (e) {}
        }
    });
})();

(function() {
    if (typeof Prism === "undefined") {
        return;
    }
    var assign = Object.assign || function(obj1, obj2) {
        for (var name in obj2) {
            if (obj2.hasOwnProperty(name)) {
                obj1[name] = obj2[name];
            }
        }
        return obj1;
    };
    function NormalizeWhitespace(defaults) {
        this.defaults = assign({}, defaults);
    }
    function toCamelCase(value) {
        return value.replace(/-(\w)/g, function(match, firstChar) {
            return firstChar.toUpperCase();
        });
    }
    function tabLen(str) {
        var res = 0;
        for (var i = 0; i < str.length; ++i) {
            if (str.charCodeAt(i) == "\t".charCodeAt(0)) {
                res += 3;
            }
        }
        return str.length + res;
    }
    NormalizeWhitespace.prototype = {
        setDefaults: function(defaults) {
            this.defaults = assign(this.defaults, defaults);
        },
        normalize: function(input, settings) {
            settings = assign(this.defaults, settings);
            for (var name in settings) {
                var methodName = toCamelCase(name);
                if (name !== "normalize" && methodName !== "setDefaults" && settings[name] && this[methodName]) {
                    input = this[methodName].call(this, input, settings[name]);
                }
            }
            return input;
        },
        leftTrim: function(input) {
            return input.replace(/^\s+/, "");
        },
        rightTrim: function(input) {
            return input.replace(/\s+$/, "");
        },
        tabsToSpaces: function(input, spaces) {
            spaces = spaces | 0 || 4;
            return input.replace(/\t/g, new Array(++spaces).join(" "));
        },
        spacesToTabs: function(input, spaces) {
            spaces = spaces | 0 || 4;
            return input.replace(RegExp(" {" + spaces + "}", "g"), "\t");
        },
        removeTrailing: function(input) {
            return input.replace(/\s*?$/gm, "");
        },
        removeInitialLineFeed: function(input) {
            return input.replace(/^(?:\r?\n|\r)/, "");
        },
        removeIndent: function(input) {
            var indents = input.match(/^[^\S\n\r]*(?=\S)/gm);
            if (!indents || !indents[0].length) {
                return input;
            }
            indents.sort(function(a, b) {
                return a.length - b.length;
            });
            if (!indents[0].length) {
                return input;
            }
            return input.replace(RegExp("^" + indents[0], "gm"), "");
        },
        indent: function(input, tabs) {
            return input.replace(/^[^\S\n\r]*(?=\S)/gm, new Array(++tabs).join("\t") + "$&");
        },
        breakLines: function(input, characters) {
            characters = characters === true ? 80 : characters | 0 || 80;
            var lines = input.split("\n");
            for (var i = 0; i < lines.length; ++i) {
                if (tabLen(lines[i]) <= characters) {
                    continue;
                }
                var line = lines[i].split(/(\s+)/g);
                var len = 0;
                for (var j = 0; j < line.length; ++j) {
                    var tl = tabLen(line[j]);
                    len += tl;
                    if (len > characters) {
                        line[j] = "\n" + line[j];
                        len = tl;
                    }
                }
                lines[i] = line.join("");
            }
            return lines.join("\n");
        }
    };
    if (typeof module !== "undefined" && module.exports) {
        module.exports = NormalizeWhitespace;
    }
    Prism.plugins.NormalizeWhitespace = new NormalizeWhitespace({
        "remove-trailing": true,
        "remove-indent": true,
        "left-trim": true,
        "right-trim": true
    });
    Prism.hooks.add("before-sanity-check", function(env) {
        var Normalizer = Prism.plugins.NormalizeWhitespace;
        if (env.settings && env.settings["whitespace-normalization"] === false) {
            return;
        }
        if (!Prism.util.isActive(env.element, "whitespace-normalization", true)) {
            return;
        }
        if ((!env.element || !env.element.parentNode) && env.code) {
            env.code = Normalizer.normalize(env.code, env.settings);
            return;
        }
        var pre = env.element.parentNode;
        if (!env.code || !pre || pre.nodeName.toLowerCase() !== "pre") {
            return;
        }
        var children = pre.childNodes;
        var before = "";
        var after = "";
        var codeFound = false;
        for (var i = 0; i < children.length; ++i) {
            var node = children[i];
            if (node == env.element) {
                codeFound = true;
            } else if (node.nodeName === "#text") {
                if (codeFound) {
                    after += node.nodeValue;
                } else {
                    before += node.nodeValue;
                }
                pre.removeChild(node);
                --i;
            }
        }
        if (!env.element.children.length || !Prism.plugins.KeepMarkup) {
            env.code = before + env.code + after;
            env.code = Normalizer.normalize(env.code, env.settings);
        } else {
            var html = before + env.element.innerHTML + after;
            env.element.innerHTML = Normalizer.normalize(html, env.settings);
            env.code = env.element.textContent;
        }
    });
})();

(function() {
    if (typeof Prism === "undefined" || typeof document === "undefined") {
        return;
    }
    var callbacks = [];
    var map = {};
    var noop = function() {};
    Prism.plugins.toolbar = {};
    var registerButton = Prism.plugins.toolbar.registerButton = function(key, opts) {
        var callback;
        if (typeof opts === "function") {
            callback = opts;
        } else {
            callback = function(env) {
                var element;
                if (typeof opts.onClick === "function") {
                    element = document.createElement("button");
                    element.type = "button";
                    element.addEventListener("click", function() {
                        opts.onClick.call(this, env);
                    });
                } else if (typeof opts.url === "string") {
                    element = document.createElement("a");
                    element.href = opts.url;
                } else {
                    element = document.createElement("span");
                }
                if (opts.className) {
                    element.classList.add(opts.className);
                }
                element.textContent = opts.text;
                return element;
            };
        }
        if (key in map) {
            console.warn('There is a button with the key "' + key + '" registered already.');
            return;
        }
        callbacks.push(map[key] = callback);
    };
    function getOrder(element) {
        while (element) {
            var order = element.getAttribute("data-toolbar-order");
            if (order != null) {
                order = order.trim();
                if (order.length) {
                    return order.split(/\s*,\s*/g);
                } else {
                    return [];
                }
            }
            element = element.parentElement;
        }
    }
    var hook = Prism.plugins.toolbar.hook = function(env) {
        var pre = env.element.parentNode;
        if (!pre || !/pre/i.test(pre.nodeName)) {
            return;
        }
        if (pre.parentNode.classList.contains("code-toolbar")) {
            return;
        }
        var wrapper = document.createElement("div");
        wrapper.classList.add("code-toolbar");
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
        var toolbar = document.createElement("div");
        toolbar.classList.add("toolbar");
        var elementCallbacks = callbacks;
        var order = getOrder(env.element);
        if (order) {
            elementCallbacks = order.map(function(key) {
                return map[key] || noop;
            });
        }
        elementCallbacks.forEach(function(callback) {
            var element = callback(env);
            if (!element) {
                return;
            }
            var item = document.createElement("div");
            item.classList.add("toolbar-item");
            item.appendChild(element);
            toolbar.appendChild(item);
        });
        wrapper.appendChild(toolbar);
    };
    registerButton("label", function(env) {
        var pre = env.element.parentNode;
        if (!pre || !/pre/i.test(pre.nodeName)) {
            return;
        }
        if (!pre.hasAttribute("data-label")) {
            return;
        }
        var element;
        var template;
        var text = pre.getAttribute("data-label");
        try {
            template = document.querySelector("template#" + text);
        } catch (e) {}
        if (template) {
            element = template.content;
        } else {
            if (pre.hasAttribute("data-url")) {
                element = document.createElement("a");
                element.href = pre.getAttribute("data-url");
            } else {
                element = document.createElement("span");
            }
            element.textContent = text;
        }
        return element;
    });
    Prism.hooks.add("complete", hook);
})();

(function() {
    if (typeof Prism === "undefined" || typeof document === "undefined") {
        return;
    }
    if (!Prism.plugins.toolbar) {
        console.warn("Copy to Clipboard plugin loaded before Toolbar plugin.");
        return;
    }
    function registerClipboard(element, copyInfo) {
        element.addEventListener("click", function() {
            copyTextToClipboard(copyInfo);
        });
    }
    function fallbackCopyTextToClipboard(copyInfo) {
        var textArea = document.createElement("textarea");
        textArea.value = copyInfo.getText();
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            var successful = document.execCommand("copy");
            setTimeout(function() {
                if (successful) {
                    copyInfo.success();
                } else {
                    copyInfo.error();
                }
            }, 1);
        } catch (err) {
            setTimeout(function() {
                copyInfo.error(err);
            }, 1);
        }
        document.body.removeChild(textArea);
    }
    function copyTextToClipboard(copyInfo) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(copyInfo.getText()).then(copyInfo.success, function() {
                fallbackCopyTextToClipboard(copyInfo);
            });
        } else {
            fallbackCopyTextToClipboard(copyInfo);
        }
    }
    function selectElementText(element) {
        window.getSelection().selectAllChildren(element);
    }
    function getSettings(startElement) {
        var settings = {
            copy: "Copy",
            "copy-error": "Press Ctrl+C to copy",
            "copy-success": "Copied!",
            "copy-timeout": 5e3
        };
        var prefix = "data-prismjs-";
        for (var key in settings) {
            var attr = prefix + key;
            var element = startElement;
            while (element && !element.hasAttribute(attr)) {
                element = element.parentElement;
            }
            if (element) {
                settings[key] = element.getAttribute(attr);
            }
        }
        return settings;
    }
    Prism.plugins.toolbar.registerButton("copy-to-clipboard", function(env) {
        var element = env.element;
        var settings = getSettings(element);
        var linkCopy = document.createElement("button");
        linkCopy.className = "copy-to-clipboard-button";
        linkCopy.setAttribute("type", "button");
        var linkSpan = document.createElement("span");
        linkCopy.appendChild(linkSpan);
        setState("copy");
        registerClipboard(linkCopy, {
            getText: function() {
                return element.textContent;
            },
            success: function() {
                setState("copy-success");
                resetText();
            },
            error: function() {
                setState("copy-error");
                setTimeout(function() {
                    selectElementText(element);
                }, 1);
                resetText();
            }
        });
        return linkCopy;
        function resetText() {
            setTimeout(function() {
                setState("copy");
            }, settings["copy-timeout"]);
        }
        function setState(state) {
            linkSpan.textContent = settings[state];
            linkCopy.setAttribute("data-copy-state", state);
        }
    });
})();

(function(window, document) {
    "use strict";
    var timer = null;
    var hasPointerEvents = "PointerEvent" in window || window.navigator && "msPointerEnabled" in window.navigator;
    var isTouch = "ontouchstart" in window || navigator.MaxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    var mouseDown = hasPointerEvents ? "pointerdown" : isTouch ? "touchstart" : "mousedown";
    var mouseUp = hasPointerEvents ? "pointerup" : isTouch ? "touchend" : "mouseup";
    var mouseMove = hasPointerEvents ? "pointermove" : isTouch ? "touchmove" : "mousemove";
    var startX = 0;
    var startY = 0;
    var maxDiffX = 10;
    var maxDiffY = 10;
    if (typeof window.CustomEvent !== "function") {
        window.CustomEvent = function(event, params) {
            params = params || {
                bubbles: false,
                cancelable: false,
                detail: undefined
            };
            var evt = document.createEvent("CustomEvent");
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        };
        window.CustomEvent.prototype = window.Event.prototype;
    }
    window.requestAnimFrame = function() {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
            window.setTimeout(callback, 1e3 / 60);
        };
    }();
    function requestTimeout(fn, delay) {
        if (!window.requestAnimationFrame && !window.webkitRequestAnimationFrame && !(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && !window.oRequestAnimationFrame && !window.msRequestAnimationFrame) return window.setTimeout(fn, delay);
        var start = new Date().getTime();
        var handle = {};
        var loop = function() {
            var current = new Date().getTime();
            var delta = current - start;
            if (delta >= delay) {
                fn.call();
            } else {
                handle.value = requestAnimFrame(loop);
            }
        };
        handle.value = requestAnimFrame(loop);
        return handle;
    }
    function clearRequestTimeout(handle) {
        if (handle) {
            window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) : window.webkitCancelAnimationFrame ? window.webkitCancelAnimationFrame(handle.value) : window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) : window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) : window.oCancelRequestAnimationFrame ? window.oCancelRequestAnimationFrame(handle.value) : window.msCancelRequestAnimationFrame ? window.msCancelRequestAnimationFrame(handle.value) : clearTimeout(handle);
        }
    }
    function fireLongPressEvent(originalEvent) {
        clearLongPressTimer();
        originalEvent = unifyEvent(originalEvent);
        var allowClickEvent = this.dispatchEvent(new CustomEvent("long-press", {
            bubbles: true,
            cancelable: true,
            detail: {
                clientX: originalEvent.clientX,
                clientY: originalEvent.clientY
            },
            clientX: originalEvent.clientX,
            clientY: originalEvent.clientY,
            offsetX: originalEvent.offsetX,
            offsetY: originalEvent.offsetY,
            pageX: originalEvent.pageX,
            pageY: originalEvent.pageY,
            screenX: originalEvent.screenX,
            screenY: originalEvent.screenY
        }));
        if (!allowClickEvent) {
            document.addEventListener("click", function suppressEvent(e) {
                document.removeEventListener("click", suppressEvent, true);
                cancelEvent(e);
            }, true);
        }
    }
    function unifyEvent(e) {
        if (e.changedTouches !== undefined) {
            return e.changedTouches[0];
        }
        return e;
    }
    function startLongPressTimer(e) {
        clearLongPressTimer(e);
        var el = e.target;
        var longPressDelayInMs = parseInt(getNearestAttribute(el, "data-long-press-delay", "1500"), 10);
        timer = requestTimeout(fireLongPressEvent.bind(el, e), longPressDelayInMs);
    }
    function clearLongPressTimer(e) {
        clearRequestTimeout(timer);
        timer = null;
    }
    function cancelEvent(e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        e.stopPropagation();
    }
    function mouseDownHandler(e) {
        startX = e.clientX;
        startY = e.clientY;
        startLongPressTimer(e);
    }
    function mouseMoveHandler(e) {
        var diffX = Math.abs(startX - e.clientX);
        var diffY = Math.abs(startY - e.clientY);
        if (diffX >= maxDiffX || diffY >= maxDiffY) {
            clearLongPressTimer(e);
        }
    }
    function getNearestAttribute(el, attributeName, defaultValue) {
        while (el && el !== document.documentElement) {
            var attributeValue = el.getAttribute(attributeName);
            if (attributeValue) {
                return attributeValue;
            }
            el = el.parentNode;
        }
        return defaultValue;
    }
    document.addEventListener(mouseUp, clearLongPressTimer, true);
    document.addEventListener(mouseMove, mouseMoveHandler, true);
    document.addEventListener("wheel", clearLongPressTimer, true);
    document.addEventListener("scroll", clearLongPressTimer, true);
    document.addEventListener(mouseDown, mouseDownHandler, true);
})(window, document);

function formatState(state) {
    if (!state.id) {
        return state.text;
    }
    if ($($(state.element).data("content")).length === 0) {
        return state.text;
    }
    var $state = $($(state.element).data("content"));
    return $state;
}

$(document).on("click", '[data-bs-toggle="confirm"]', function(e) {
    if ($(this).prop("tagName").toLowerCase() === "a") {
        e.preventDefault();
        var button = $(this);
        var link = button.attr("href");
        var text = button.data("title");
        var title = button.html();
        $(this).html("<span class='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span> Loading...");
        bootbox.confirm({
            centerVertical: true,
            title: title,
            message: text,
            buttons: {
                confirm: {
                    label: '<i class="fa fa-check"></i> ' + $(this).data("yes"),
                    className: "btn-success"
                },
                cancel: {
                    label: '<i class="fa fa-times"></i> ' + $(this).data("no"),
                    className: "btn-danger"
                }
            },
            callback: function(confirmed) {
                if (confirmed) {
                    document.location.href = link;
                } else {
                    button.html(title);
                }
            }
        });
    }
});

$(window).scroll(function() {
    if ($(this).scrollTop() > 50) {
        $(".scroll-top:hidden").stop(true, true).fadeIn();
    } else {
        $(".scroll-top").stop(true, true).fadeOut();
    }
});

$(function() {
    $(".btn-scroll").click(function() {
        $("html,body").animate({
            scrollTop: $("header").offset().top
        }, "1000");
        return false;
    });
});

document.addEventListener("DOMContentLoaded", function() {
    if (document.body.contains(document.getElementById("PasswordToggle"))) {
        var passwordToggle = document.getElementById("PasswordToggle");
        var icon = passwordToggle.querySelector("i");
        var pass = document.querySelector("input[id*='Password']");
        passwordToggle.addEventListener("click", function(event) {
            event.preventDefault();
            if (pass.getAttribute("type") === "text") {
                pass.setAttribute("type", "password");
                icon.classList.add("fa-eye-slash");
                icon.classList.remove("fa-eye");
            } else if (pass.getAttribute("type") === "password") {
                pass.setAttribute("type", "text");
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        });
    }
});

function getAlbumImagesData(pageSize, pageNumber, isPageChange) {
    var yafUserID = $("#PostAlbumsListPlaceholder").data("userid");
    var pagedResults = {};
    pagedResults.UserId = yafUserID;
    pagedResults.PageSize = pageSize;
    pagedResults.PageNumber = pageNumber;
    var ajaxURL = $("#PostAlbumsListPlaceholder").data("url") + "api/Album/GetAlbumImages";
    $.ajax({
        url: ajaxURL,
        type: "POST",
        data: JSON.stringify(pagedResults),
        contentType: "application/json; charset=utf-8",
        success: function(data) {
            $("#PostAlbumsListPlaceholder ul").empty();
            $("#PostAlbumsLoader").hide();
            if (data.AttachmentList.length === 0) {
                var list = $("#PostAlbumsListPlaceholder ul");
                var notext = $("#PostAlbumsListPlaceholder").data("notext");
                list.append('<li><div class="alert alert-info text-break" role="alert" style="white-space:normal">' + notext + "</div></li>");
            }
            $.each(data.AttachmentList, function(id, data) {
                var list = $("#PostAlbumsListPlaceholder ul"), listItem = $('<li class="list-group-item list-group-item-action" style="white-space: nowrap; cursor: pointer;" />');
                listItem.attr("onclick", data.OnClick);
                listItem.append(data.IconImage);
                list.append(listItem);
            });
            setPageNumberAlbums(pageSize, pageNumber, data.TotalRecords);
            if (isPageChange) {
                jQuery(".albums-toggle").dropdown("toggle");
            }
            var tooltipAlbumsTriggerList = [].slice.call(document.querySelectorAll("#PostAlbumsListPlaceholder ul li"));
            var tooltipAlbumsList = tooltipAlbumsTriggerList.map(function(tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl, {
                    html: true,
                    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner" style="max-width:250px"></div></div>',
                    placement: "top"
                });
            });
        },
        error: function(request, status, error) {
            console.log(request);
            console.log(error);
            $("#PostAlbumsLoader").hide();
            $("#PostAlbumsListPlaceholder").html(request.statusText).fadeIn(1e3);
        }
    });
}

function setPageNumberAlbums(pageSize, pageNumber, total) {
    var pages = Math.ceil(total / pageSize);
    var pagerHolder = $("#AlbumsListPager"), pagination = $('<ul class="pagination pagination-sm" />');
    pagerHolder.empty();
    pagination.wrap('<nav aria-label="Albums Page Results" />');
    if (pageNumber > 0) {
        pagination.append('<li class="page-item"><a href="javascript:getAlbumImagesData(' + pageSize + "," + (pageNumber - 1) + "," + total + ',true)" class="page-link"><i class="fas fa-angle-left"></i></a></li>');
    }
    var start = pageNumber - 2;
    var end = pageNumber + 3;
    if (start < 0) {
        start = 0;
    }
    if (end > pages) {
        end = pages;
    }
    if (start > 0) {
        pagination.append('<li class="page-item"><a href="javascript:getAlbumImagesData(' + pageSize + "," + 0 + "," + total + ', true);" class="page-link">1</a></li>');
        pagination.append('<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">...</a></li>');
    }
    for (var i = start; i < end; i++) {
        if (i === pageNumber) {
            pagination.append('<li class="page-item active"><span class="page-link">' + (i + 1) + "</span>");
        } else {
            pagination.append('<li class="page-item"><a href="javascript:getAlbumImagesData(' + pageSize + "," + i + "," + total + ',true);" class="page-link">' + (i + 1) + "</a></li>");
        }
    }
    if (end < pages) {
        pagination.append('<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">...</a></li>');
        pagination.append('<li class="page-item"><a href="javascript:getAlbumImagesData(' + pageSize + "," + (pages - 1) + "," + total + ',true)" class="page-link">' + pages + "</a></li>");
    }
    if (pageNumber < pages - 1) {
        pagination.append('<li class="page-item"><a href="javascript:getAlbumImagesData(' + pageSize + "," + (pageNumber + 1) + "," + total + ',true)" class="page-link"><i class="fas fa-angle-right"></i></a></li>');
    }
    pagerHolder.append(pagination);
}

function getPaginationData(pageSize, pageNumber, isPageChange) {
    var yafUserID = $("#PostAttachmentListPlaceholder").data("userid");
    var pagedResults = {};
    pagedResults.UserId = yafUserID;
    pagedResults.PageSize = pageSize;
    pagedResults.PageNumber = pageNumber;
    var ajaxURL = $("#PostAttachmentListPlaceholder").data("url") + "api/Attachment/GetAttachments";
    $.ajax({
        type: "POST",
        url: ajaxURL,
        data: JSON.stringify(pagedResults),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            $("#PostAttachmentListPlaceholder ul").empty();
            $("div#PostAttachmentLoader").hide();
            if (data.AttachmentList.length === 0) {
                var list = $("#PostAttachmentListPlaceholder ul");
                var notext = $("#PostAttachmentListPlaceholder").data("notext");
                list.append('<li><div class="alert alert-info text-break" role="alert" style="white-space:normal">' + notext + "</div></li>");
            }
            $.each(data.AttachmentList, function(id, data) {
                var list = $("#PostAttachmentListPlaceholder ul"), listItem = $('<li class="list-group-item list-group-item-action" style="white-space: nowrap; cursor: pointer;" />');
                listItem.attr("onclick", data.OnClick);
                listItem.append(data.IconImage);
                list.append(listItem);
            });
            setPageNumberAttach(pageSize, pageNumber, data.TotalRecords);
        },
        error: function(request) {
            $("div#PostAttachmentLoader").hide();
            $("#PostAttachmentListPlaceholder").html(request.statusText).fadeIn(1e3);
        }
    });
}

function setPageNumberAttach(pageSize, pageNumber, total) {
    var pages = Math.ceil(total / pageSize);
    var pagerHolder = $("div#AttachmentsListPager"), pagination = $('<ul class="pagination pagination-sm" />');
    pagerHolder.empty();
    pagination.wrap('<nav aria-label="Attachments Page Results" />');
    if (pageNumber > 0) {
        pagination.append('<li class="page-item"><a href="javascript:getPaginationData(' + pageSize + "," + (pageNumber - 1) + "," + total + ',true)" class="page-link"><i class="fas fa-angle-left"></i></a></li>');
    }
    var start = pageNumber - 2;
    var end = pageNumber + 3;
    if (start < 0) {
        start = 0;
    }
    if (end > pages) {
        end = pages;
    }
    if (start > 0) {
        pagination.append('<li class="page-item"><a href="javascript:getPaginationData(' + pageSize + "," + 0 + "," + total + ', true);" class="page-link">1</a></li>');
        pagination.append('<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">...</a></li>');
    }
    for (var i = start; i < end; i++) {
        if (i === pageNumber) {
            pagination.append('<li class="page-item active"><span class="page-link">' + (i + 1) + "</span>");
        } else {
            pagination.append('<li class="page-item"><a href="javascript:getPaginationData(' + pageSize + "," + i + "," + total + ',true);" class="page-link">' + (i + 1) + "</a></li>");
        }
    }
    if (end < pages) {
        pagination.append('<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">...</a></li>');
        pagination.append('<li class="page-item"><a href="javascript:getPaginationData(' + pageSize + "," + (pages - 1) + "," + total + ',true)" class="page-link">' + pages + "</a></li>");
    }
    if (pageNumber < pages - 1) {
        pagination.append('<li class="page-item"><a href="javascript:getPaginationData(' + pageSize + "," + (pageNumber + 1) + "," + total + ',true)" class="page-link"><i class="fas fa-angle-right"></i></a></li>');
    }
    pagerHolder.append(pagination);
}

function getNotifyData(pageSize, pageNumber, isPageChange) {
    var yafUserID = $("#NotifyListPlaceholder").data("userid");
    var pagedResults = {};
    pagedResults.UserId = yafUserID;
    pagedResults.PageSize = pageSize;
    pagedResults.PageNumber = pageNumber;
    var ajaxURL = $("#NotifyListPlaceholder").data("url") + "api/Notify/GetNotifications";
    $.ajax({
        type: "POST",
        url: ajaxURL,
        data: JSON.stringify(pagedResults),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            $("#NotifyListPlaceholder ul").empty();
            $("#Loader").hide();
            if (data.AttachmentList.length > 0) {
                $("#MarkRead").removeClass("d-none").addClass("d-block");
                $.each(data.AttachmentList, function(id, data) {
                    var list = $("#NotifyListPlaceholder ul"), listItem = $('<li class="list-group-item list-group-item-action small text-wrap" style="width:15rem;" />');
                    listItem.append(data.FileName);
                    list.append(listItem);
                });
                setPageNumberNotify(pageSize, pageNumber, data.TotalRecords);
                if (isPageChange) {
                    jQuery(".notify-toggle").dropdown("toggle");
                }
            }
        },
        error: function(request) {
            $("#Loader").hide();
            $("#NotifyListPlaceholder").html(request.statusText).fadeIn(1e3);
        }
    });
}

function setPageNumberNotify(pageSize, pageNumber, total) {
    var pages = Math.ceil(total / pageSize);
    var pagerHolder = $("#NotifyListPager"), pagination = $('<ul class="pagination pagination-sm" />');
    pagerHolder.empty();
    pagination.wrap('<nav aria-label="Attachments Page Results" />');
    if (pageNumber > 0) {
        pagination.append('<li class="page-item"><a href="javascript:getNotifyData(' + pageSize + "," + (pageNumber - 1) + "," + total + ',true)" class="page-link"><i class="fas fa-angle-left"></i></a></li>');
    }
    var start = pageNumber - 2;
    var end = pageNumber + 3;
    if (start < 0) {
        start = 0;
    }
    if (end > pages) {
        end = pages;
    }
    if (start > 0) {
        pagination.append('<li class="page-item"><a href="javascript:getNotifyData(' + pageSize + "," + 0 + "," + total + ', true);" class="page-link">1</a></li>');
        pagination.append('<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">...</a></li>');
    }
    for (var i = start; i < end; i++) {
        if (i === pageNumber) {
            pagination.append('<li class="page-item active"><span class="page-link">' + (i + 1) + "</span>");
        } else {
            pagination.append('<li class="page-item"><a href="javascript:getNotifyData(' + pageSize + "," + i + "," + total + ',true);" class="page-link">' + (i + 1) + "</a></li>");
        }
    }
    if (end < pages) {
        pagination.append('<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">...</a></li>');
        pagination.append('<li class="page-item"><a href="javascript:getNotifyData(' + pageSize + "," + (pages - 1) + "," + total + ',true)" class="page-link">' + pages + "</a></li>");
    }
    if (pageNumber < pages - 1) {
        pagination.append('<li class="page-item"><a href="javascript:getNotifyData(' + pageSize + "," + (pageNumber + 1) + "," + total + ',true)" class="page-link"><i class="fas fa-angle-right"></i></a></li>');
    }
    pagerHolder.append(pagination);
}

function getSearchResultsData(pageNumber) {
    var searchInput = jQuery(".searchInput").val();
    var searchInputUser = jQuery(".searchUserInput").val();
    var searchInputTag = jQuery(".searchTagInput").val();
    var useDisplayName = jQuery(".searchUserInput").data("display") === "True";
    var pageSize = jQuery(".resultsPage").val();
    var titleOnly = jQuery(".titleOnly").val();
    var searchWhat = jQuery(".searchWhat").val();
    var minimumLength = jQuery("#SearchResultsPlaceholder").data("minimum");
    var searchForum = parseInt(jQuery(".searchForum").val());
    var searchText = "";
    if (searchInput.length && searchInput.length >= minimumLength || searchInputUser.length && searchInputUser.length >= minimumLength || searchInputTag.length && searchInputTag.length >= minimumLength) {
        var replace;
        if (searchInput.length && searchInput.length >= minimumLength) {
            if (titleOnly === "1") {
                if (searchWhat === "0") {
                    replace = searchInput;
                    searchText += " Topic: (" + replace.replace(/(^|\s+)/g, "$1+") + ")";
                } else if (searchWhat === "1") {
                    searchText += " Topic: " + searchInput;
                } else if (searchWhat === "2") {
                    searchText += " Topic:" + '"' + searchInput + '"';
                }
            } else {
                if (searchWhat === "0") {
                    replace = searchInput;
                    searchText += "(" + replace.replace(/(^|\s+)/g, "$1+") + ")";
                } else if (searchWhat === "1") {
                    searchText += "" + searchInput;
                } else if (searchWhat === "2") {
                    searchText += "" + '"' + searchInput + '"';
                }
            }
        }
        if (searchInputUser.length && searchInputUser.length >= minimumLength) {
            var author = useDisplayName ? "AuthorDisplay" : "Author";
            if (searchText.length) searchText += " ";
            if (searchInput.length) {
                searchText += "AND " + author + ":" + searchInputUser;
            } else {
                searchText = "+" + author + ":" + searchInputUser;
            }
        }
        if (searchInputTag.length && searchInputTag.length >= minimumLength) {
            if (searchText.length) searchText += " ";
            if (searchInput.length) {
                searchText += "AND TopicTags:" + searchInputTag;
            } else {
                searchText = "+TopicTags:" + searchInputTag;
            }
        }
        var searchTopic = {};
        searchTopic.ForumId = searchForum;
        searchTopic.PageSize = pageSize;
        searchTopic.Page = pageNumber;
        searchTopic.SearchTerm = searchText;
        var ajaxUrl = $("#SearchResultsPlaceholder").data("url") + "api/Search/GetSearchResults";
        $.ajax({
            type: "POST",
            url: ajaxUrl,
            data: JSON.stringify(searchTopic),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            beforeSend: function() {
                $("#SearchResultsPlaceholder").empty();
                $("#loadModal").modal("show");
            },
            complete: function() {
                $("#loadModal").modal("hide");
            },
            success: function(data) {
                $("#loadModal").on("shown.bs.modal", function() {
                    $("#loadModal").modal("hide");
                });
                var posted = $("#SearchResultsPlaceholder").data("posted");
                var by = $("#SearchResultsPlaceholder").data("by");
                var lastpost = $("#SearchResultsPlaceholder").data("lastpost");
                var topic = $("#SearchResultsPlaceholder").data("topic");
                if (data.SearchResults.length === 0) {
                    var list = $("#SearchResultsPlaceholder");
                    var notext = $("#SearchResultsPlaceholder").data("notext");
                    list.append('<div class="alert alert-warning text-center mt-3" role="alert">' + notext + "</div>");
                    $("#SearchResultsPagerTop, #SearchResultsPagerBottom").empty();
                } else {
                    $.each(data.SearchResults, function(id, data) {
                        var groupHolder = $("#SearchResultsPlaceholder");
                        var tags = " ";
                        if (data.TopicTags) {
                            var topicTags = data.TopicTags.split(",");
                            $(topicTags).each(function(index, d) {
                                tags += "<span class='badge bg-secondary me-1'><i class='fas fa-tag me-1'></i>" + d + "</span>";
                            });
                        }
                        groupHolder.append('<div class="row"><div class="col"><div class="card border-0 w-100 mb-3">' + '<div class="card-header bg-transparent border-top border-bottom-0 px-0 pb-0 pt-4 topicTitle"><h5> ' + '<a title="' + topic + '" href="' + data.TopicUrl + '">' + data.Topic + "</a>&nbsp;" + "<a " + 'title="' + lastpost + '" href="' + data.MessageUrl + '"><i class="fas fa-external-link-alt"></i></a>' + ' <small class="text-muted">(<a href="' + data.ForumUrl + '">' + data.ForumName + "</a>)</small>" + "</h5></div>" + '<div class="card-body px-0">' + '<h6 class="card-subtitle mb-2 text-muted">' + data.Description + "</h6>" + '<p class="card-text messageContent">' + data.Message + "</p>" + "</div>" + '<div class="card-footer bg-transparent border-top-0 px-0 py-2"> ' + '<small class="text-muted">' + '<span class="fa-stack">' + '<i class="fa fa-calendar-day fa-stack-1x text-secondary"></i>' + '<i class="fa fa-circle fa-badge-bg fa-inverse fa-outline-inverse"></i> ' + '<i class="fa fa-clock fa-badge text-secondary"></i> ' + "</span>" + posted + " " + data.Posted + " " + '<i class="fa fa-user fa-fw text-secondary"></i>' + by + " " + (useDisplayName ? data.UserDisplayName : data.UserName) + tags + "</small> " + "</div>" + "</div></div></div>");
                    });
                    setPageNumber(pageSize, pageNumber, data.TotalRecords);
                }
            },
            error: function(request) {
                console.log(request);
                $("#SearchResultsPlaceholder").html(request.responseText).fadeIn(1e3);
            }
        });
    }
}

function setPageNumber(pageSize, pageNumber, total) {
    var pages = Math.ceil(total / pageSize);
    var pagerHolder = $("#SearchResultsPagerTop, #SearchResultsPagerBottom"), pagination = $('<ul class="pagination" />');
    pagerHolder.empty();
    pagination.wrap('<nav aria-label="Search Page Results" />');
    if (pageNumber > 0) {
        pagination.append('<li class="page-item"><a href="javascript:getSearchResultsData(' + (pageNumber - 1) + ')" class="page-link"><i class="fas fas fa-angle-left" aria-hidden="true"></i></a></li>');
    }
    var start = pageNumber - 2;
    var end = pageNumber + 3;
    if (start < 0) {
        start = 0;
    }
    if (end > pages) {
        end = pages;
    }
    if (start > 0) {
        pagination.append('<li class="page-item"><a href="javascript:getSearchResultsData(' + 0 + ');" class="page-link">1</a></li>');
        pagination.append('<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">...</a></li>');
    }
    for (var i = start; i < end; i++) {
        if (i === pageNumber) {
            pagination.append('<li class="page-item active"><span class="page-link">' + (i + 1) + "</span>");
        } else {
            pagination.append('<li class="page-item"><a href="javascript:getSearchResultsData(' + i + ');" class="page-link">' + (i + 1) + "</a></li>");
        }
    }
    if (end < pages) {
        pagination.append('<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">...</a></li>');
        pagination.append('<li class="page-item"><a href="javascript:getSearchResultsData(' + (pages - 1) + ')" class="page-link">' + pages + "</a></li>");
    }
    if (pageNumber < pages - 1) {
        pagination.append('<li class="page-item"><a href="javascript:getSearchResultsData(' + (pageNumber + 1) + ')" class="page-link"><i class="fas fas fa-angle-right" aria-hidden="true"></i></a></li>');
    }
    pagerHolder.append(pagination);
}

jQuery(document).ready(function() {
    if (jQuery(".searchSimilarTopics").length) {
        jQuery(".searchSimilarTopics").keyup(function() {
            var input = jQuery(".searchSimilarTopics"), searchText = input.val(), searchPlaceHolder = jQuery("#SearchResultsPlaceholder");
            if (searchText.length && searchText.length >= 4) {
                var searchTopic = {};
                searchTopic.ForumId = 0;
                searchTopic.PageSize = 0;
                searchTopic.Page = 0;
                searchTopic.SearchTerm = searchText;
                var ajaxUrl = searchPlaceHolder.data("url") + "api/Search/GetSimilarTitles";
                $.ajax({
                    type: "POST",
                    url: ajaxUrl,
                    dataType: "json",
                    data: JSON.stringify(searchTopic),
                    contentType: "application/json; charset=utf-8",
                    beforeSend: function() {
                        searchPlaceHolder.empty();
                        searchPlaceHolder.remove("list-group");
                    },
                    complete: function() {},
                    success: function(data) {
                        searchPlaceHolder.empty();
                        searchPlaceHolder.remove("list-group");
                        if (data.TotalRecords > 0) {
                            var list = $('<ul class="list-group list-similar" />');
                            searchPlaceHolder.append(list);
                            $.each(data.SearchResults, function(id, data) {
                                list.append('<li class="list-group-item">' + '<a href="' + data.TopicUrl + '" target="_blank">' + data.Topic + "</a></li>");
                            });
                        }
                    },
                    error: function(request) {
                        searchPlaceHolder.html(request.statusText).fadeIn(1e3);
                    }
                });
            }
        });
    }
});

$(document).ready(function() {
    $("a.btn-login,input.btn-login, .btn-spinner").click(function() {
        $(this).html("<span class='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span> Loading...");
    });
    $(".dropdown-menu a.dropdown-toggle").on("click", function(e) {
        var $el = $(this), $subMenu = $el.next();
        $(".dropdown-menu").find(".show").removeClass("show");
        $subMenu.addClass("show");
        $subMenu.css({
            top: $el[0].offsetTop - 10,
            left: $el.outerWidth() - 4
        });
        e.stopPropagation();
    });
    $("input[type='number']").each(function() {
        if ($(this).hasClass("form-pager")) {
            var holder = $(this).closest(".mb-3");
            $(this).TouchSpin({
                min: holder.data("min"),
                max: holder.data("max")
            });
        } else {
            $(this).TouchSpin({
                max: 2147483647
            });
        }
    });
    $(".serverTime-Input").TouchSpin({
        min: -720,
        max: 720
    });
    $(".yafnet .select2-select").each(function() {
        $(this).select2({
            width: "100%",
            theme: "bootstrap-5",
            placeholder: $(this).attr("placeholder")
        });
    });
    if ($(".select2-image-select").length) {
        var selected = $(".select2-image-select").val();
        var groups = {};
        $(".yafnet .select2-image-select option[data-category]").each(function() {
            var sGroup = $.trim($(this).attr("data-category"));
            groups[sGroup] = true;
        });
        $.each(groups, function(c) {
            $(".yafnet .select2-image-select").each(function() {
                $(this).find("option[data-category='" + c + "']").wrapAll('<optgroup label="' + c + '">');
            });
        });
        $(".select2-image-select").val(selected);
    }
    $(".yafnet .select2-image-select").each(function() {
        $(this).select2({
            width: "100%",
            theme: "bootstrap-5",
            allowClearing: $(this).data("allow-clear") == "True",
            dropdownAutoWidth: true,
            templateResult: formatState,
            templateSelection: formatState,
            placeholder: $(this).attr("placeholder")
        }).on("select2:select", function(e) {
            if (e.params.data.url) {
                window.location = e.params.data.url;
            }
        });
    });
    if ($("#PostAttachmentListPlaceholder").length) {
        var pageSize = 5;
        var pageNumber = 0;
        getPaginationData(pageSize, pageNumber, false);
    }
    if ($("#SearchResultsPlaceholder").length) {
        $(".searchInput").keypress(function(e) {
            var code = e.which;
            if (code === 13) {
                e.preventDefault();
                var pageNumberSearch = 0;
                getSearchResultsData(pageNumberSearch);
            }
        });
    }
    $(".dropdown-notify").on("show.bs.dropdown", function() {
        var pageSize = 5;
        var pageNumber = 0;
        getNotifyData(pageSize, pageNumber, false);
    });
    $(".form-check > input").addClass("form-check-input");
    $(".form-check li > input").addClass("form-check-input");
    $(".form-check > label").addClass("form-check-label");
    $(".form-check li > label").addClass("form-check-label");
    $(".img-user-posted").on("error", function() {
        $(this).parent().parent().hide();
    });
});

document.addEventListener("DOMContentLoaded", function() {
    Prism.highlightAll();
    var popoverTriggerList = [].slice.call(document.querySelectorAll(".thanks-popover"));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl, {
            template: '<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-header"></h3><div class="popover-body popover-body-scrollable"></div></div>'
        });
    });
    $(".thanks-popover").on("show.bs.popover", function() {
        var messageId = $(this).data("messageid");
        var url = $(this).data("url");
        $.ajax({
            url: url + "/ThankYou/GetThanks/" + messageId,
            type: "POST",
            contentType: "application/json;charset=utf-8",
            cache: true,
            success: function(response) {
                $("#popover-list-" + messageId).html(response.ThanksInfo);
            }
        });
    });
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    [].forEach.call(document.querySelectorAll(".attachedImage"), function(imageLink) {
        var messageId = imageLink.parentNode.id;
        imageLink.setAttribute("data-gallery", "#blueimp-gallery-" + messageId);
    });
});

jQuery(document).ready(function() {
    $(".list-group-item-menu, .message").each(function() {
        var isMessageContext = !!$(this).hasClass("message");
        var contextMenu = $(this).find(".context-menu");
        var messageID = $(this).find(".selectionQuoteable").attr("id");
        if (window.matchMedia("only screen and (max-width: 760px)").matches) {
            var el = $(this)[0];
            el.addEventListener("long-press", function(e) {
                e.preventDefault();
                if (isMessageContext) {
                    var selectedText = getSelectedMessageText();
                    if (selectedText.length) {
                        var searchItem = contextMenu.find(".item-search");
                        if (searchItem.length) {
                            searchItem.remove();
                        }
                        var selectedItem = contextMenu.find(".item-selected-quoting");
                        if (selectedItem.length) {
                            selectedItem.remove();
                        }
                        var selectedDivider = contextMenu.find(".selected-divider");
                        if (selectedDivider.length) {
                            selectedDivider.remove();
                        }
                        if (contextMenu.data("url")) {
                            contextMenu.prepend("<a href=\"javascript:goToURL('" + messageID + "','" + selectedText + "','" + contextMenu.data("url") + '\')" class="dropdown-item item-selected-quoting"><i class="fas fa-quote-left fa-fw"></i>&nbsp;' + contextMenu.data("quote") + "</a>");
                        }
                        contextMenu.prepend("<a href=\"javascript:copyToClipBoard('" + selectedText + '\')" class="dropdown-item item-search"><i class="fas fa-clipboard fa-fw"></i>&nbsp;' + contextMenu.data("copy") + "</a>");
                        contextMenu.prepend('<div class="dropdown-divider selected-divider"></div>');
                        contextMenu.prepend("<a href=\"javascript:searchText('" + selectedText + '\')" class="dropdown-item item-search"><i class="fas fa-search fa-fw"></i>&nbsp;' + contextMenu.data("search") + ' "' + selectedText + '"</a>');
                    }
                }
                contextMenu.css({
                    display: "block"
                }).addClass("show").offset({
                    left: e.detail.clientX,
                    top: e.detail.clientY
                });
            });
        }
        $(this).on("contextmenu", function(e) {
            if (isMessageContext) {
                var selectedText = getSelectedMessageText();
                if (selectedText.length) {
                    var searchItem = contextMenu.find(".item-search");
                    if (searchItem.length) {
                        searchItem.remove();
                    }
                    var selectedItem = contextMenu.find(".item-selected-quoting");
                    if (selectedItem.length) {
                        selectedItem.remove();
                    }
                    var selectedDivider = contextMenu.find(".selected-divider");
                    if (selectedDivider.length) {
                        selectedDivider.remove();
                    }
                    if (contextMenu.data("url")) {
                        contextMenu.prepend("<a href=\"javascript:goToURL('" + messageID + "','" + selectedText + "','" + contextMenu.data("url") + '\')" class="dropdown-item item-selected-quoting"><i class="fas fa-quote-left fa-fw"></i>&nbsp;' + contextMenu.data("quote") + "</a>");
                    }
                    contextMenu.prepend("<a href=\"javascript:copyToClipBoard('" + selectedText + '\')" class="dropdown-item item-search"><i class="fas fa-clipboard fa-fw"></i>&nbsp;' + contextMenu.data("copy") + "</a>");
                    contextMenu.prepend('<div class="dropdown-divider selected-divider"></div>');
                    contextMenu.prepend("<a href=\"javascript:searchText('" + selectedText + '\')" class="dropdown-item item-search"><i class="fas fa-search fa-fw"></i>&nbsp;' + contextMenu.data("search") + ' "' + selectedText + '"</a>');
                }
            }
            contextMenu.removeClass("show").hide();
            contextMenu.css({
                display: "block"
            }).addClass("show").offset({
                left: e.pageX,
                top: e.pageY
            });
            return false;
        }).on("click", function() {
            contextMenu.removeClass("show").hide();
        });
        $(this).find(".context-menu a").on("click", function(e) {
            if ($(this).data("toggle") !== undefined && $(this).data("toggle") == "confirm") {
                e.preventDefault();
                var link = $(this).attr("href");
                var text = $(this).data("title");
                var title = $(this).html();
                bootbox.confirm({
                    centerVertical: true,
                    title: title,
                    message: text,
                    buttons: {
                        confirm: {
                            label: '<i class="fa fa-check"></i> ' + $(this).data("yes"),
                            className: "btn-success"
                        },
                        cancel: {
                            label: '<i class="fa fa-times"></i> ' + $(this).data("no"),
                            className: "btn-danger"
                        }
                    },
                    callback: function(confirmed) {
                        if (confirmed) {
                            document.location.href = link;
                        }
                    }
                });
            }
            contextMenu.removeClass("show").hide();
        });
        $("body").click(function() {
            contextMenu.removeClass("show").hide();
        });
    });
});

function goToURL(messageId, input, url) {
    window.location.href = url + "&q=" + messageId + "&text=" + encodeURIComponent(input);
}

function copyToClipBoard(input) {
    navigator.clipboard.writeText(input);
}

function searchText(input) {
    let a = document.createElement("a");
    a.target = "_blank";
    a.href = "https://www.google.com/search?q=" + encodeURIComponent(input);
    a.click();
}

function getSelectedMessageText() {
    var text = "";
    var sel = window.getSelection();
    if (sel.rangeCount) {
        var container = document.createElement("div");
        for (var i = 0, len = sel.rangeCount; i < len; ++i) {
            container.appendChild(sel.getRangeAt(i).cloneContents());
        }
        text = container.textContent || container.innerText;
    }
    return text.replace(/<p[^>]*>/gi, "\n").replace(/<\/p>|  /gi, "").replace("(", "").replace(")", "").replace('"', "").replace("'", "").replace("'", "").replace(";", "").trim();
}