import config from '../config';

export const getHashParams = (hash = '') => {
  let hashParams = {};
  let e,
    a = /\+/g,  // Regex for replacing addition symbol with a space
    r = /([^&;=]+)=?([^&;]*)/g,
    d = function (s) {
      return decodeURIComponent(s.replace(a, " "));
    },
    q = hash.toString().substring(1);
  
  while ((e = r.exec(q)))
    hashParams[d(e[1])] = d(e[2]);
  
  return hashParams;
};

export const strictValidObject = obj => obj && obj === Object(obj) &&
Object.prototype.toString.call(obj) !== '[object Array]';