// app.js
const ecBLE = require('./utils/ecBLE.js');
App({
  onLaunch() {
    let lastInterval = 0;
    // 展示本地存储能力
    // const logs = wx.getStorageSync('logs') || []
    // logs.unshift(Date.now())
    // wx.setStorageSync('logs', logs)
    this.watch('sleepTime',(value,lastValue)=>{
      if(lastValue===0 && value>1) {
        this.globalData.lastInterval = setInterval(() => {
          if (this.globalData.sleepTime > 1) {
            --this.globalData.sleepTime;
          } else if (this.globalData.sleepTime === 1) {
            clearInterval(lastInterval);
            this.globalData.sleepTime = 0;
            ecBLE.closeBLEConnection();
          } else {
            clearInterval(lastInterval);
          }
        }, 1000);

      }
    });
  },
  watcher:{},
  watch:function(name,callback){
    if(this.watcher[name]) {
      this.watcher[name].push(callback);
    } else {
      this.watcher[name]=[callback];
    }
    const that=this;
    Object.defineProperty(this.globalData,name, {
      configurable: true,
      enumerable: true,
      set: function(value) {
        let lastValue = this['_'+name];
        this['_'+name] = value;
        for(let func of that.watcher[name]) {
          func(value,lastValue);
        }
      },
      get:function(){
        return this['_'+name];
      }
    })
  },
  globalData: {
    _sleepTime: 0,
  }
})
