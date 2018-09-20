let utils = require('../../utils/utils')
Page({
  data: {
    // 一些setting页面需要的数据
    setting: {},
    show: false,
    screenBrightness: '获取中',
    keepscreenon: false,
    SDKVersion: '',
    enableUpdate: true,
  },
  switchChange(e) {
    // 当前事件，触发的对象，的dataset ( 所有data-* 数据)
    let dataset = e.currentTarget.dataset

    // 从dataset中找到数据
    let switchparam = dataset.switchparam
    let setting = this.data.setting
    if (switchparam === 'forceUpdate') {
      // 
      if (this.data.enableUpdate) {
        // e.detail: event额外的信息, 查看每个组件各自的detail
        setting[switchparam] = (e.detail || {}).value
      } else {
        setting[switchparam] = false
        wx.showToast({
          title: '基础库版本较低，无法使用该功能',
          icon: 'none',
          duration: 2000,
        })
      }
    } else if (switchparam === 'keepscreenon') {
      this.setKeepScreenOn(!this.data.keepscreenon)
      getApp().globalData.keepscreenon = !this.data.keepscreenon
    } else {
      setting[switchparam] = !(e.detail || {}).value
    }

    // 更新数据（both 对象 和页面都更新）
    this.setData({
      setting,
    })

    // 将数据存储在本地缓存中指定的 key 中，会覆盖掉原来该 key 对应的内容。
    wx.setStorage({
      key: 'setting',
      data: setting,
    })
  },
  defaultBcg () {
    this.removeBcg(() => {
      wx.showToast({
        title: '恢复默认背景',
        duration: 1500,
      })
    })
  },
  removeBcg (callback) {
    // 删除本地的图片

    // 获取该小程序下已保存的本地缓存文件列表
    wx.getSavedFileList({
      success: function (res) {
        // 文件数组，每一项是一个 FileItem
        let fileList = res.fileList
        let len = fileList.length

        // 把所有本地缓存的文件都删了
        if (len > 0) {
          for (let i = 0; i < len; i++)
          (function (path) {
            // 删除本地缓存文件
            wx.removeSavedFile({
              filePath: path,
              complete: function (res) {
                if (i === len - 1) {
                  // 执行callback
                  callback && callback()
                }
              }
            })
          })(fileList[i].filePath)
        } else {
          callback && callback()
        }
      },
      fail: function () {
        wx.showToast({
          title: '出错了，请稍后再试',
          icon: 'none',
        })
      },
    })
  },
  customBcg () {
    // 修改默认图片
    let that = this

    // 调用微信接口，从本地相册选择图片或使用相机拍照。
    wx.chooseImage({
      success: function (res) {
        that.removeBcg(() => {
          // 保存文件到本地。注意：saveFile 会把临时文件移动，因此调用成功后传入的 tempFilePath 将不可用
          wx.saveFile({
            // res.tempFilePaths : 图片的本地临时文件路径列表
            tempFilePath: res.tempFilePaths[0],
            success: function (res) {
              // 关闭当前页面，返回上一页面
              wx.navigateBack({})
            },
          })
        })
      },
      fail: function (res) {
        let errMsg = res.errMsg
        // 如果是取消操作，不提示
        if (errMsg.indexOf('cancel') === -1) {
          wx.showToast({
            title: '发生错误，请稍后再试',
            icon: 'none',
          })
        }
      },
    })
  },
  hide () {
    this.setData({
      show: false,
    })
  },
  updateInstruc () {
    this.setData({
      show: true,
    })
  },
  onShow () {
    // 不能初始化到 data 里面！！！！
    this.setData({
      keepscreenon: getApp().globalData.keepscreenon,
    })
    this.ifDisableUpdate()
    this.getScreenBrightness()
    let that = this
    wx.getStorage({
      key: 'setting',
      success: function(res) {
        let setting = res.data
        that.setData({
          setting,
        })
      },
      fail: function (res) {
        that.setData({
          setting: {},
        })
      },
    })
  },
  ifDisableUpdate () {
    let systeminfo = getApp().globalData.systeminfo
    let SDKVersion = systeminfo.SDKVersion
    let version = utils.cmpVersion(SDKVersion, '1.9.90')
    if (version >=0) {
      this.setData({
        SDKVersion,
        enableUpdate: true,
      })
    } else {
      this.setData({
        SDKVersion,
        enableUpdate: false,
      })
    }
  },
  getHCEState () {
    // 显示 loading 提示框, 需主动调用 wx.hideLoading 才能关闭提示框
    wx.showLoading({
      title: '检测中...',
    })

    // 判断当前设备是否支持 HCE 能力。
    wx.getHCEState({
      success: function (res) {
        // 隐藏loading对话框
        wx.hideLoading()

        // 显示模态对话框
        wx.showModal({
          title: '检测结果',
          content: '该设备支持NFC功能',
          showCancel: false,
          confirmText: '朕知道了',
          confirmColor: '#40a7e7',
        })
      },
      fail: function (res) {
        wx.hideLoading()
        wx.showModal({
          title: '检测结果',
          content: '该设备不支持NFC功能',
          showCancel: false,
          confirmText: '朕知道了',
          confirmColor: '#40a7e7',
        })
      },
    })
  },
  getScreenBrightness () {
    let that = this

    // 获取屏幕亮度
    wx.getScreenBrightness({
      success: function (res) {
        that.setData({
          screenBrightness: Number(res.value * 100).toFixed(0),
        })
      },
      fail: function (res) {
        that.setData({
          screenBrightness: '获取失败',
        })
      },
    })
  },
  screenBrightnessChanging (e) {
    // 设置屏幕亮度
    this.setScreenBrightness(e.detail.value)
  },
  setScreenBrightness (val) {
    let that = this

    // 设置屏幕亮度
    wx.setScreenBrightness({
      value: val / 100,
      success: function (res) {
        // 成功的话，更新数据，通知ui更新数据
        that.setData({
          screenBrightness: val,
        })
      },
    })
  },
  setKeepScreenOn (b) {
    let that = this
    wx.setKeepScreenOn({
      keepScreenOn: b,
      success () {
        that.setData({
          keepscreenon: b,
        })
      },
    })
  },


  getsysteminfo () {
    // 保留当前页面，跳转到应用内的某个页面，但是不能跳到 tabbar 页面。
    // 跳转到系统信息页面
    wx.navigateTo({
      url: '/pages/systeminfo/systeminfo',
    })
  },
  removeStorage (e) {
    let that = this
    let datatype = e.currentTarget.dataset.type
    if (datatype === 'menu') {
      wx.setStorage({
        key: 'pos',
        data: {
          top: 'auto',
          left: 'auto',
        },
        success: function (res) {
          wx.showToast({
            title: '悬浮球已复位',
          })
        },
      })
    } else if (datatype === 'setting') {
      wx.showModal({
        title: '提示',
        content: '确认要初始化设置',
        cancelText: '容朕想想',
        confirmColor: '#40a7e7',
        success(res) {
          if (res.confirm) {
            // 删除缓存信息
            wx.removeStorage({
              key: 'setting',
              success: function (res) {
                wx.showToast({
                  title: '设置已初始化',
                })
                that.setData({
                  setting: {},
                })
              },
            })
          }
        },
      })
    } else if (datatype === 'all') {
      wx.showModal({
        title: '提示',
        content: '确认要删除',
        cancelText: '容朕想想',
        confirmColor: '#40a7e7',
        success (res) {
          if (res.confirm) {
            // 清理本地数据缓存
            wx.clearStorage({
              success: function (res) {
                wx.showToast({
                  title: '数据已清除',
                })
                that.setData({
                  setting: {},
                  pos: {},
                })
              },
            })
          }
        },
      })
    }
  },

})