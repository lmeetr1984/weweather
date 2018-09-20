let staticData = require('../../data/staticData.js')
let utils = require('../../utils/utils.js')
Page({
  data: {
    alternative: null,
    cities: [],
    // 需要显示的城市
    showItems: [],
    inputText: '', // 输入的检索数据
  },
  cancel () {
    this.setData({
      inputText: '',
      showItems: this.data.cities,
    })
  },
  inputFilter (e) {
    let alternative = {}

    // 所有的城市
    let cities = this.data.cities
    // 替换掉空白符
    let value = e.detail.value.replace(/\s+/g, '')

    // 如果不是空字符串
    if (value.length) {
      // 遍历26个字母代表的城市组
      for (let i in cities) {
        let items = cities[i]
        // 遍历每个组的所有城市
        for (let j = 0, len = items.length; j < len; j++) {
          let item = items[j]
          // 找到了
          if (item.name.indexOf(value) !== -1) {
            // 如果是第i个字母找到了候选是空的，那么创建一个数组
            if (utils.isEmptyObject(alternative[i])) {
              alternative[i] = []
            }
            alternative[i].push(item) // 候选插入数组
          }
        }
      }
      if (utils.isEmptyObject(alternative)) {
        alternative = null
      }
      this.setData({
        alternative, // 设置数据
        showItems: alternative,
      })
    } else {
      this.setData({
        alternative: null,
        showItems: cities,
      })
    }
  },
  // 按照字母顺序生成需要的数据格式
  getSortedAreaObj(areas) {
    // let areas = staticData.areas
    // 先按照字母排序
    areas = areas.sort((a, b) => {
      if (a.letter > b.letter) {
        return 1
      }
      if (a.letter < b.letter) {
        return -1
      }
      return 0
    })

    // 遍历所有的城市数据, 相同的字母城市做成一个数组
    let obj = {}
    for (let i = 0, len = areas.length; i < len; i++) {
      let item = areas[i]
      delete item.districts
      
      let letter = item.letter
      if (!obj[letter]) {
        obj[letter] = []
      }
      obj[letter].push(item)
    }
    // 返回一个对象，直接用 wx:for 来遍历对象，index 为 key，item 为 value，item 是一个数组
    return obj
  },

  choose(e) {
    // dataset: 事件源组件上由data-开头的自定义属性组成的集合
    // currentTarget: 事件绑定的当前组件。
    let item = e.currentTarget.dataset.item
    let name = item.name

    // 当前的所有页面
    let pages = getCurrentPages()
    let len = pages.length

    // 主页的页面
    let indexPage = pages[len - 2]

    // 设置页面数据，准备切换
    indexPage.setData({
      // 是否切换了城市
      cityChanged: true,
      // 需要查询的城市
      searchCity: name,
    })

    // 关闭当前页面，返回上一页面或多级页面。
    wx.navigateBack({})
  },

  onLoad () {
    // 获取排好序的城市数据
    let cities = this.getSortedAreaObj(staticData.cities || [])
    this.setData({
      cities,
      showItems: cities,
      alternative: {},
    })
  },
})