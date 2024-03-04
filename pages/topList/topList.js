// pages/topList/topList.js
import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list:[],
    playCount: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getTopList()
  },

  async getTopList(){
    let listData = await request('/toplist')
    this.setData({
      list:listData.list
    })
    let playCount = []
    for (let i = 0; i < listData.list.length; i++) {
      if ((listData.list[i].playCount / 100000000)>=1){
        playCount[i] = (listData.list[i].playCount / 100000000).toFixed(1)+'亿'
      } else if ((listData.list[i].playCount / 10000) >= 1){
        playCount[i] = Math.floor(listData.list[i].playCount / 10000) +'万'
      }
    }
    this.setData({
      playCount
    })
  },

  toPersonalized(e){
    let id = e.currentTarget.dataset.id
    wx.reLaunch({
      url: '/pages/personalized/personalized?id=' + id
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})