// pages/grandient/index.js
const ecBLE = require('../../utils/ecBLE.js');
const {
  throttle,
} = require('../../utils/util.js');

const headBeginInitColor='rgb(255,174,000)';
const headEndInitColor='rgb(000,025,255)';
const tailBeginInitColor='rgb(255,063,000)';
const tailEndInitColor='rgb(071,209,037)';

const getFontColor = background => {
  const rgb = background.split(',');
  const R = parseInt(rgb[0].split('(')[1]);
  const G = parseInt(rgb[1]);
  const B = parseInt(rgb[2].split(')')[0]);
  const gray = R*0.299 + G*0.587 + B*0.114;
  if(gray<=160) {
    return 'white';
  } else {
    return 'black';
  }
}

Page({
  data: {
    headBegin: {
      key: 'headBegin',
      name: '顶端起始色',
      rgb: headBeginInitColor,
      pick: false,
      fontColor: getFontColor(headBeginInitColor),
    },
    headEnd: {
      key: 'headEnd',
      name: '顶端结束色',
      rgb: headEndInitColor,
      pick: false,
      fontColor: getFontColor(headEndInitColor),
    },
    tailBegin: {
      key: 'tailBegin',
      name: '底端起始色',
      rgb: tailBeginInitColor,
      pick: false,
      fontColor: getFontColor(tailBeginInitColor),
    },
    tailEnd: {
      key: 'tailEnd',
      name: '底端结束色',
      rgb: tailEndInitColor,
      pick: false,
      fontColor: getFontColor(tailEndInitColor),
    },
    period: 10,
  },
  toPick: function (e) {
    const key = e.currentTarget.dataset.key;
    const value = this.data[key];
    value.pick = true;
    this.setData({
      [key]: value,
    })
  },
  pickColor(e) {
    const rgb = e.detail.color.split(',');
    const R = rgb[0].split('(')[1].padStart(3,'0');
    const G = rgb[1].padStart(3,'0');
    const B = rgb[2].split(')')[0].padStart(3,'0');
    const color = `rgb(${R},${G},${B})`;
    const key = e.currentTarget.dataset.key;
    const value = this.data[key];
    value.rgb = color;
    value.fontColor = getFontColor(color);
    this.setData({
      [key]: value,
    });
  },
  showModal(title, content) {
    wx.showModal({
      title: title,
      content: content,
      showCancel: false
    });
  },
  setGradient: async function(){
    wx.showLoading({
      title: '设置中',
      mask:true,
    });
    const colorList = [];
    let rgb,R,G,B
    rgb = this.data.headBegin.rgb.split(',');
    R = rgb[0].split('(')[1].padStart(3,'0');
    G = rgb[1].padStart(3,'0');
    B = rgb[2].split(')')[0].padStart(3,'0');
    colorList.push(R,G,B);
    rgb = this.data.headEnd.rgb.split(',');
    R = rgb[0].split('(')[1].padStart(3,'0');
    G = rgb[1].padStart(3,'0');
    B = rgb[2].split(')')[0].padStart(3,'0');
    colorList.push(R,G,B);
    rgb = this.data.tailBegin.rgb.split(',');
    R = rgb[0].split('(')[1].padStart(3,'0');
    G = rgb[1].padStart(3,'0');
    B = rgb[2].split(')')[0].padStart(3,'0');
    colorList.push(R,G,B);
    rgb = this.data.tailEnd.rgb.split(',');
    R = rgb[0].split('(')[1].padStart(3,'0');
    G = rgb[1].padStart(3,'0');
    B = rgb[2].split(')')[0].padStart(3,'0');
    colorList.push(R,G,B);
    const res = await ecBLE.easySendHex([
      "T".charCodeAt(),
      ...colorList,
      this.data.period,
    ]);
    if(res.ok) {
      this.showModal("提示","设置成功");
    } else {
      this.showModal("错误","设置失败，原因:"+res.errMsg);
    }
    wx.hideLoading();
  },
  cancelGradient: async function(){
    wx.showLoading({
      title: '取消中',
      mask:true,
    });
    const res = await ecBLE.easySendData('R');
    if(res.ok) {
      this.showModal("提示","取消成功");
    } else {
      this.showModal("错误","取消失败，原因:"+res.errMsg);
    }
    wx.hideLoading();
  },
});
