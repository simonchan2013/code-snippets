// =====================================================================================================================
// Description: mysql dao and api - base construstor
// =====================================================================================================================
'use strict';

const BASEAPI = require('../../base/index');
const logger = BASEAPI.getLogger(module);
const mysql = require('mysql');
const Promise = require('bluebird');



// =====================================================================================================================
/**
 * constructor
 * @param {Object} option - mysql config info
 */
function MysqlBase(option) {
  this.option = option;
  this.pool = mysql.createPool(option);
}

/**
 * close the pool
 * @function closePool
 * @return {void}
 */
MysqlBase.prototype.closePool = function() {
  this.pool.end(err => {
    if (err) {
      logger.error('[MYSQL_ERROR] Error occurs when colse the pool!');
      logger.error(err.stack);
      return;
    }
    logger.log('the pool connect to ' +
      this.option.host + ':' + this.option.port + '/' + this.option.database +
      ' has been closed!');
  })
}

/**
 * return a Promise with a mysql connection and also can use callback
 * @function getConnection
 * @param {Function} cb
 * @return {Promise}
 */
MysqlBase.prototype.getConnection = function(cb) {
  var _this = this;
  return new Promise((_resolve, _reject) => {
    const resolve = ret => {
      _resolve(ret);
      cb && cb(null, ret);
    }
    const reject = err => {
      _reject(err);
      cb && cb(err);
    }

    _this.pool.getConnection((err, conn) => {
      if (err) {
        logger.error(err.stack);
        reject(err);
      }
      else resove(conn);
    });
  });
}

/**
 * release a mysql connection
 * @function release
 * @param {Object} connection
 * @return {void}
 */
MysqlBase.prototype.release = function(conn) {
  conn.release();
}

/**
 * execute sql with a params object or a params array
 * @function executeSql
 * @param {String} sql
 * @param {Object} params
 * @param {Function} queryFormat - special format function
 */
MysqlBase.prototype.executeSql = function(sql, params, queryFormat) {
  let _this = this;
  return new Promise((resolve, reject) => {
    _this.pool.getConnection((err, conn) => {
      if (err) {
        logger.error('[MYSQL_ERROR] Error occurs when get connection in executeSql(sql, params)!');
        logger.error(err.stack);
        reject(err);
        return;
      }

      const _defaultQueryFormat = conn.config.queryFormat;
      if (queryFormat) conn.config.queryFormat = queryFormat;

      conn.query(sql, params, (queryErr, result) => {
        if (queryFormat) conn.config.queryFormat = _defaultQueryFormat;
        conn.release();
        if (queryErr) {
          logger.error('[MYSQL_ERROR] Error occurs when query sql in executeSql(sql, params), and the sql is ' + sql);
          logger.error(queryErr.stack);
          reject(queryErr);
        } else {
          resolve(result);
        }
      });
    });
  });
}

/**
 * execute transaction, commit the transaction only when all sql execute success
 * @function executeTransaction
 * @param {Array} an array of objs, each obj contain sql and params
 *    Example:
 *            [{ sql:sql1, params:params1 }, { sql:sql2, params:params2}, ...]
 *
 * @return {Promise}
 */
MysqlBase.prototype.executeTransaction = function(stepArr, queryFormat) {
  let _this = this;
  return new Promise((_resolve, _reject) => {
    _this.pool.getConnection((err, conn) => {
      if (err) {
        logger.error('[MYSQL_ERROR] Error occurs when get connection in executeTransaction(stepArr)!');
        logger.error(err.stack);
        _reject(err);
        return;
      }

      const _defaultQueryFormat = conn.config.queryFormat;
      if (queryFormat) conn.config.queryFormat = queryFormat;

      conn.beginTransaction(transactionErr => {
        if (transactionErr) {
          logger.error('[MYSQL_ERROR] Error occurs when beginTransaction in executeTransaction(stepArr)!');
          logger.error(transactionErr.stack);
          _reject(transactionErr);
          return;
        }

        // 开始依次执行事务中的sql
        return Promise.each(stepArr, (stepObj, idx) => {
          return new Promise((resolve, reject) => {
            conn.query(stepObj.sql, stepObj.params, (queryErr, result) => {
              if (queryErr) {
                let errLogStr = '[MYSQL_ERROR] Error occurs when query sql in executeTransaction(stepArr), ' +
                  'and the sql is ' + stepObj.sql;

                logger.error(errLogStr);
                logger.error(queryErr.stack);
                reject(queryErr);
              } else {
                logger.log('query success');
                resolve(result);
              }
            });
          })
        })
        .then(results => {
          return new Promise((resolve, reject) => {
            conn.commit(commitErr => {
              if (commitErr) {
                logger.error('[MYSQL_ERROR] Error occurs when commit transaction in executeTransaction(stepArr)!');
                logger.error(commitErr.stack);
                reject(commitErr);
              } else {
                if (queryFormat) conn.config.queryFormat = _defaultQueryFormat;
                conn.release();
                logger.log('transaction success');
                _resolve('SUCCESS');
              }
            });
          });
        })
        .catch(err => {
          conn.rollback(() => {
            logger.log('rollback the transaction');
            if (queryFormat) conn.config.queryFormat = _defaultQueryFormat;
            conn.release();
            throw err;
          });
        });

      })
    })
  })
}



// =====================================================================================================================
module.exports = MysqlBase;
