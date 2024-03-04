import PubSub from 'pubsub-js';
import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    day: '', // 天
    month: '', // 月
    recommendList: [], // 推荐列表数据
    index: 0, // 点击音乐的下标
  },

  //生成随机整数
  randomNum(minNum, maxNum) {
    switch (arguments.length) {
      case 1:
        return parseInt(Math.random() * minNum + 1, 10);
        break;
      case 2:
        return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
        break;
      default:
        return 0;
        break;
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 判断用户是否登录
    let userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          // 跳转至登录界面
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      })
    }
    // 更新日期的状态数据
    this.setData({
      day: new Date().getDate(),
      month: new Date().getMonth() + 1
    })

    // 获取每日推荐的数据
    this.getRecommendList();

    // //播放列表切换歌曲
    PubSub.subscribe('recommendPindex', (msg, index) => {
      let recommendList = this.data.recommendList;
      let musicId = recommendList[index].id;
      // 更新下标
      this.setData({
        index
      })
      PubSub.publish('recommendMusicId', musicId)
    })

    // 订阅来自songDetail页面发布的消息，上下首切换
    PubSub.subscribe('recommendSwitchType', (msg, obj) => {
      let { recommendList, index } = this.data;
      //列表播放
      if (obj.temp === 0) {
        if (obj.type === 'pre') { // 上一首
          (index === 0) && (index = recommendList.length);
          index -= 1;
        } else if (obj.type === 'next') { // 下一首
          (index === recommendList.length - 1) && (index = -1);
          index += 1;
        };
        //单曲循环
      } else if (obj.temp === 1) {
        if (obj.type === 'pre') { // 上一首
          (index === 0);
          index;
        } else if (obj.type === 'next') { // 下一首
          (index === recommendList.length - 1);
          index;
        };
        //随机播放
      } else if (obj.temp === -1) {
        if (obj.type === 'pre') { // 上一首
          index = this.randomNum(-1, recommendList.length - 1)
        } else if (obj.type === 'next') { // 下一首
          index = this.randomNum(-1, recommendList.length - 1)
        };
      }
      // 更新下标
      this.setData({
        index
      })
      let musicId = recommendList[index].id;
      // 将musicId回传给songDetail页面
      PubSub.publish('recommendMusicId', musicId)
    });
  },

  // 获取用户每日推荐数据
  async getRecommendList() {
    let recommendListData = await request('/recommend/songs');
    this.setData({
      recommendList: recommendListData.recommend
    })
  },

  // 跳转至songDetail页面
  toSongDetail(event) {
    let { song, index } = event.currentTarget.dataset;
    this.setData({
      index
    })
    // 路由跳转传参： query参数
    wx.navigateTo({
      // 不能直接将song对象作为参数传递，长度过长，会被自动截取掉
      // url: '/pages/songDetail/songDetail?songPackage=' + JSON.stringify(songPackage)
      url: '/pages/songDetail/songDetail?musicId=' + song.id + '&type=recommend'
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
