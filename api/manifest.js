const config = require('config');
const rootPackage = require('../package.json');
const constants = require('./constants');
var corsHeaders = {
  origin: ["*"],
  headers: ["Access-Control-Allow-Origin","Access-Control-Allow-Headers","Access-Control-Request-Method", "Accept", "Content-Type", "If-None-Match", "Access-Control-Request-Headers","Connection, Host, Origin, X-Requested-With, Content-Type", "Authorization", "RefreshToken"],
  credentials: true
};

module.exports = {
  server: {
    host: config.api.host,
    port: config.api.port,
    routes: {
      cors: corsHeaders
    }
  },
  register: {
      plugins: [
        {
            plugin: require('inert')
        },
        {
            plugin: require('vision')
        },
        {
          plugin: require('hapi-swagger'),
          options:  {
            pathPrefixSize: 1,
            grouping: 'tags',
            sortTags: 'name',
            expanded: 'none',
            info: {
              title: `${rootPackage.name} Documentation`,
              version: rootPackage.version,
              contact: {
                name: 'Closeloop',
                email: 'info@premier-recruiter.com',
              },
            },
          },
        },
        {
          plugin: require('yar'),
          options: {
            storeBlank: false,
            cookieOptions: {
              password: config.api.secret,
              isSecure: false,
              isHttpOnly: true,
            },
          },
        },
        {
          plugin: require('./plugins/auth'),
          options: {
            secret: config.api.secret,
            isSecure: false
          },
        },
        {
          plugin: require('./plugins/common'),
          options: {},
        },
        // {
        //   plugin: require('./plugins/notification'),
        //   options: {
        //     host: config.redis.host,
        //     port: config.redis.port
        //   },
        // },
        {
          plugin: require('hapi-router'),
          options: {
            cwd: __dirname,
            routes: 'controllers/**/*Controller.js',
          },
        },
        {
          plugin: require('good'),
          options: {
            reporters: {
              console: [
                {
                  module: 'good-squeeze',
                  name: 'Squeeze',
                  args: [{
                    response: '*',
                    error: '*',
                    log: '*',
                  }],
                },
                {
                  module: 'good-console',
                },
                'stdout',
              ],
            },
          },
        }
      ],
      options: {
          once: true
      }
  }
};