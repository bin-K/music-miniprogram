// pages/personalized/personalized.js
import request from '../../utils/request'
import PubSub from 'pubsub-js';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    coverImgUrl: '',
    titleName: '',
    description: '',
    listDetail: [],
    index: 0,//音乐下标
    playListId:0,
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
    let playListId = options.id
    this.setData({
      playListId
    })
    this.getListDatail(playListId)
  },

  async getListDatail(id) {
    let listDetailData = await request('/playlist/detail', { id })
    let coverImgUrl = listDetailData.playlist.coverImgUrl
    let titleName = listDetailData.playlist.name
    let description = listDetailData.playlist.description
    let tracks = []
    let length = listDetailData.playlist.tracks.length
    if (length > 20) {
      length = 20;
      for (let i = 0; i < length; i++) {
        tracks[i] = listDetailData.playlist.tracks[i]
      }
    }else{
      tracks = listDetailData.playlist.tracks
    }
    this.setData({
      listDetail: tracks,
      coverImgUrl,
      titleName,
      description
    })
    // //播放列表切换歌曲
    PubSub.subscribe('personalizedPindex', (msg, index) => {
      let listDetail = this.data.listDetail;
      let musicId = listDetail[index].id;
      // 更新下标
      this.setData({
        index
      })
      PubSub.publish('personalizedMusicId', musicId)
    })

    // 订阅来自songDetail页面发布的消息，上下首切换
    PubSub.subscribe('personalizedSwitchType', (msg, obj) => {
      let { listDetail, index } = this.data;
      //列表播放
      if (obj.temp === 0) {
        if (obj.type === 'pre') { // 上一首
          (index === 0) && (index = listDetail.length);
          index -= 1;
        } else if (obj.type === 'next') { // 下一首
          (index === listDetail.length - 1) && (index = -1);
          index += 1;
        };
        //单曲循环
      } else if (obj.temp === 1) {
        if (obj.type === 'pre') { // 上一首
          (index === 0);
          index;
        } else if (obj.type === 'next') { // 下一首
          (index === listDetail.length - 1);
          index;
        };
        //随机播放
      } else if (obj.temp === -1) {
        if (obj.type === 'pre') { // 上一首
          index = this.randomNum(-1, listDetail.length - 1)
        } else if (obj.type === 'next') { // 下一首
          index = this.randomNum(-1, listDetail.length - 1)
        };
      }
      // 更新下标
      this.setData({
        index
      })
      let musicId = listDetail[index].id;
      // 将musicId回传给songDetail页面
      PubSub.publish('personalizedMusicId', musicId)
    });
  },
  //播放歌单歌曲
  playOne(e){
    let { index, id } = e.currentTarget.dataset
    let {playListId} = this.data
    this.setData({
      index
    })
    // 路由跳转传参： query参数
    wx.navigateTo({
      url: '/pages/songDetail/songDetail?musicId=' + id + '&type=personalized&p=' + playListId
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