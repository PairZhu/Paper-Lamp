const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const throttle = (func, delay) => {
  let timer = null;
  return function () {
    const context = this;
    const args = arguments;
    if (!timer) {
      timer = setTimeout(function () {
        func.apply(context, args);
        timer = null;
      }, delay);
    }
  }
}

const formatSeconds = (value,format='hh:mm:ss') => {
  const formatObj = {
    'h+': parseInt(value/60/60),
    'm+': parseInt(value/60)%60,
    's+': parseInt(value%60),
  };
  for (let key in formatObj) {
    if (new RegExp(`(${key})`).test(format)) { 
      format = format.replace(RegExp.$1, (formatObj[key] + '').padStart(RegExp.$1.length, '0'));
    }
  }
  return format;
}

const wait = ms=> {
  return new Promise(resolve=>{
    setTimeout(()=>resolve(),ms);
  })
}

module.exports = {
  formatTime,
  throttle,
  formatSeconds,
  wait,
}
