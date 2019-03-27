
// require dependencies
const util = require('util');

// create connect
const CONNECT = {};

/**
 * create eden session store
 *
 * @extends Events
 */
class EdenSessionStore {
  /**
   * construct session store
   *
   * @param {Object} options
   */
  constructor(options) {
    // get eden
    this.eden = options.eden;

    // set options
    this.__options = options;

    // bind methods
    this.get     = this.get.bind(this);
    this.set     = this.set.bind(this);
    this.all     = this.all.bind(this);
    this.clear   = this.clear.bind(this);
    this.touch   = this.touch.bind(this);
    this.length  = this.length.bind(this);
    this.destroy = this.destroy.bind(this);

    // bind private methods
    this.__ttl = this.__ttl.bind(this);
  }

  /**
   * set inherits
   *
   * @param  {session} session
   *
   * @return {*}
   */
  static initialize(session) {
    // inherits
    util.inherits(EdenSessionStore, session.Store);

    // set store
    CONNECT.store = session.Store;
    CONNECT.session = session;
  }

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String}   sessionID
   * @param {Function} fn
   *
   * @return {*}
   */
  async get(sessionID, fn) {
    // set session
    const prefix = this.__options.prefix || '';

    // get from eden
    const data = await this.eden.get(`${prefix ? `${prefix}.` : ''}session.${sessionID}`) || null;

    // check data
    if (data) {
      // return data
      fn(null, data);
    } else {
      fn();
    }
  }

  /**
   * Commit the given `sess` object associated with the given `sid`.
   *
   * @param {String}   sessionID
   * @param {Session}  session
   * @param {Function} fn
   *
   * @return {*}
   */
  async set(sessionID, session, fn) {
    // set session
    const ttl = this.__ttl(sessionID, session);
    const prefix = this.__options.prefix || '';

    // set
    await this.eden.set(`${prefix ? `${prefix}.` : ''}session.${sessionID}`, session, ttl);

    // return function
    if (fn) fn(null, true);
  }

  /**
   * returns all
   *
   * @param  {Function} fn
   *
   * @return {*}
   */
  async all(fn) {
    // set session
    const prefix = this.__options.prefix || '';

    // return function
    if (fn) fn(null, Array.from((await this.eden.get(`${prefix ? `${prefix}.` : ''}session.*`)).values()));
  }

  /**
   * Refresh the time-to-live for the session with the given `sid`.
   *
   * @param {String}   sessionID
   * @param {Session}  session
   * @param {Function} fn
   *
   * @return {*}
   */
  async touch(sessionID, session, fn) {
    // return set
    return this.set(sessionID, session, fn);
  }

  /**
   * clear all sessions
   *
   * @param  {Function} fn
   *
   * @return {*}
   */
  async clear(fn) {
    // set session
    const prefix = this.__options.prefix || '';

    // delete
    await this.eden.del(`${prefix ? `${prefix}.` : ''}session.*`);

    // return function
    if (fn) fn(null, true);
  }

  /**
   * returns all
   *
   * @param  {Function} fn
   *
   * @return {*}
   */
  async length(fn) {
    // set session
    const prefix = this.__options.prefix || '';

    // return function
    if (fn) fn(null, (await this.eden.get(`${prefix ? `${prefix}.` : ''}session.*`)).size);
  }

  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String}   sessionID
   * @param {Function} fn
   *
   * @return {*}
   */
  async destroy(sessionID, fn) {
    // set session
    const prefix = this.__options.prefix || '';

    // delete
    await this.eden.del(`${prefix ? `${prefix}.` : ''}session.${sessionID}`);

    // return function
    if (fn) fn(null, true);
  }

  /**
   * returns ttl as number
   *
   * @param  {Store}  store
   * @param  {Object} sess
   * @param  {String} sid
   *
   * @return {Integer}
   */
  __ttl(sessionID, session) {
    // check number ttl
    if (typeof CONNECT.store.ttl === 'number' || typeof CONNECT.store.ttl === 'string') return CONNECT.store.ttl;

    // check function ttl
    if (typeof CONNECT.store.ttl === 'function') return CONNECT.store.ttl(CONNECT.store, session, sessionID);

    // no ttl
    if (CONNECT.store.ttl) throw new TypeError('`store.ttl` must be a number or function.');

    // get max age
    const maxAge = session.cookie.maxAge;

    // return max age is number
    return (typeof maxAge === 'number' ? Math.floor(maxAge / 1000) : 86400) * 1000;
  }
}

// create eden session store
exports = module.exports = EdenSessionStore;
