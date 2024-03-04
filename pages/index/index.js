import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bannerList: [], // 轮播图数据
    recommendList: [], // 推荐歌单
    topList: [], // 排行榜数据
    playCount: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    //获取轮播图数据
    let bannerListData = await request('/banner', { type: 2 });
    this.setData({
      bannerList: bannerListData.banners
    })

    // 获取推荐歌单数据
    let recommendListData = await request('/personalized', { limit: 10 });
    this.setData({
      recommendList: recommendListData.result
    })
    let playCount = []
    for (let i = 0; i < recommendListData.result.length; i++) {
      if ((recommendListData.result[i].playCount / 100000000) >= 1) {
        playCount[i] = (recommendListData.result[i].playCount / 100000000).toFixed(1) + '亿'
      } else if ((recommendListData.result[i].playCount / 10000) >= 1) {
        playCount[i] = Math.floor(recommendListData.result[i].playCount / 10000) + '万'
      }
    }
    this.setData({
      playCount
    })
    //获取排行榜数据
    let index = 0;
    let resultArr = [];
    while (index < 5) {
      let topListData = await request('/top/list', { idx: index++ });
      // splice(会修改原数组，可以对指定的数组进行增删改) slice(不会修改原数组)
      let topListItem = { id: topListData.playlist.id, name: topListData.playlist.name, tracks: topListData.playlist.tracks.slice(0, 3) };
      resultArr.push(topListItem);
      // 不需要等待五次请求全部结束才更新，用户体验较好，但是渲染次数会多一些
      this.setData({
        topList: resultArr
      })
    }
  },

  toPersonalized(e){
    let id = e.currentTarget.dataset.id
    wx.reLaunch({
      url: '/pages/personalized/personalized?id='+id
    })
  },
  // 跳转至recommendSong页面的回调
  toRecommendSong() {
    wx.reLaunch({
      url: '/pages/recommendSong/recommendSong'
    })
  },
  // 跳转至搜索界面
  toSearch() {
    wx.reLaunch({
      url: '/pages/search/search'
    })
  },

  toPlayList(){
    wx.reLaunch({
      url: '/pages/playList/playList'
    })
  },
  
  toTopList(){
    wx.reLaunch({
      url: '/pages/topList/topList'
    })
  },
  toFM(){
    wx.reLaunch({
      url: '/pages/FM/FM'
    })
  },
  toDJ(){
    wx.showToast({
      title: '功能待完善',
      icon: 'none',
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
