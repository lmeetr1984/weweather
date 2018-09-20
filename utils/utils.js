let formatDate = (nDate, date) => {
  if (isNaN(nDate.getTime())) {
    // 不是时间格式
    return '--'
  }
  let o = {
    'M+': nDate.getMonth() + 1,
    'd+': nDate.getDate(),
    'h+': nDate.getHours(),
    'm+': nDate.getMinutes(),
    's+': nDate.getSeconds(),
    // 季度
    'q+': Math.floor((nDate.getMonth() + 3) / 3),
    'S': nDate.getMilliseconds()
  }
  if (/(y+)/.test(date)) {
    date = date.replace(RegExp.$1, (nDate.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(date)) {
      date = date.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
    }
  }
  return date
}

// 判断一个对象是否是空对象，就是没有属性
let isEmptyObject = (obj) => {
  for (let i in obj) {
    return false
  }
  return true
}

/// 获取主题的颜色 or 图片
let themeSetting = () => {
  // 默认的北京颜色
  let bcgColor = '#40a7e7'

  /// 获取当前的时间
  let hour = new Date().getHours()

  // 不同时间段的颜色不一样
  if (hour >= 6 && hour <= 17) {
    bcgColor = '#40a7e7'
  } else {
    bcgColor = '#384148'
  }

  // 导航栏的颜色
  wx.setNavigationBarColor({
    frontColor: '#ffffff', // 前景色是白色
    backgroundColor: bcgColor, // 背景色是获取的颜色
  })
  return bcgColor
}

// 比较版本号：left > right 1, left < right -1, left == right 0
// 用途：旧版本不执行写入、删除 日历操作
let cmpVersion = (left, right) => {
  if (typeof left + typeof right !== 'stringstring') {
    return false
  }
  let a = left.split('.')
  let b = right.split('.')
  let i = 0
  let len = Math.max(a.length, b.length)
  for (; i < len; i++) {
    if ((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) {
      return 1
    } else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) {
      return -1
    }
  }
  return 0
}

// 导出模块属性
module.exports = {
  formatDate,
  isEmptyObject,
  themeSetting,
  cmpVersion,
}