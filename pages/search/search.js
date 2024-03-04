import request from '../../utils/request';
import PubSub from 'pubsub-js';
let isSend = false; // 函数节流使用
Page({

  /**
   * 页面的初始数据
   */
  data: {
    placeholderContent: '', // placeholder的内容
    hotList: [], // 热搜榜数据
    searchContent: '', // 用户输入的表单项数据
    suggestList:[],//搜索建议结果
    searchList:[],
    historyList: [], // 搜索历史记录
    isSearch: false,//判断是否是搜索结果
    notFound: false,//是否搜索到歌曲
    songPic:[],//音乐图片
    index:0 //音乐下标
  },

  //生成随机整数
  randomNum(minNum, maxNum) {
    switch (arguments.length) {
      case 1:
        return parseInt(Math.random() * minNum + 1, 10);
      case 2:
        return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
      default:
        return 0;
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取初始化数据
    this.getInitData();
    // 获取历史记录
    this.getSearchHistory();
  },

  // 获取初始化的数据
  async getInitData() {
    let placeholderData = await request('/search/default');
    let hotListData = await request('/search/hot/detail');
    this.setData({
      placeholderContent: placeholderData.data.showKeyword,
      hotList: hotListData.data
    })
  },

  // 获取本地历史记录的功能函数
  getSearchHistory() {
    let historyList = wx.getStorageSync('searchHistory');
    if (historyList) {
      this.setData({
        historyList
      })
    }
  },
  // 表单项内容发生改变的回调
  handleInputChange(event) {
    // console.log(event);
    // 更新searchContent的状态数据
    this.setData({
      searchContent: event.detail.value.trim()
    })
    if (event.detail.value.trim() === ''){
      this.setData({
        isSearch:false
      })
    }
    if (isSend) {
      return
    }
    isSend = true;
    this.getSearchList();
    // 函数节流
    setTimeout(() => {
      isSend = false;
    }, 300)

  },
  // 获取搜索数据的功能函数
  async getSearchList() {
    if (!this.data.searchContent) {
      this.setData({
        suggestList: []
      })
      return;
    }
    let searchContent = this.data.searchContent;
    // 发请求获取关键字模糊匹配数据
    let suggestListData = await request('/search', { keywords: searchContent, limit:15 });
    this.setData({
      suggestList: suggestListData.result.songs
    })
  },
  // 清空搜索内容
  clearSearchContent() {
    this.setData({
      searchContent: '',
      suggestList: [],
      isSearch: false
    })
  },
  //点击历史记录
  clickHistory(e){
    let index = e.currentTarget.dataset.index
    let historyList = this.data.historyList
    let searchContent = historyList[index];
    this.setData({
      searchContent
    })
    if (isSend) {
      return
    }
    isSend = true;
    this.getSearchList();
    // 函数节流
    setTimeout(() => {
      isSend = false;
    }, 300)
  },
  // 删除搜索历史记录
  deleteSearchHistory() {
    wx.showModal({
      content: '确认删除吗?',
      success: (res) => {
        if (res.confirm) {
          // 清空data中historyList
          this.setData({
            historyList: []
          })
          // 移除本地的历史记录缓存
          wx.removeStorageSync('searchHistory');
        }
      }
    })

  },
  //点击热搜榜
  clickHotList(e){
    let index =  e.currentTarget.dataset.index;
    let {hotList} = this.data
    let searchContent = hotList[index].searchWord;
    this.setData({
      searchContent
    })
    if (isSend) {
      return
    }
    isSend = true;
    this.getSearchList();
    // 函数节流
    setTimeout(() => {
      isSend = false;
    }, 300)
  },
  //点击搜索内容
  clicksearchContent(){
    this.searchSong()
  },
  //搜索歌曲
  searchSong() {
    this.setData({
      isSearch: true
    })
    let { searchContent, historyList, placeholderContent} = this.data;
    if (searchContent === ''){
      this.setData({
        searchContent: placeholderContent
      })
      if (isSend) {
        return
      }
      isSend = true;
      this.getSearchList();
      // 函数节流
      setTimeout(() => {
        isSend = false;
      }, 300)
      // 将搜索的关键字添加到搜索历史记录中
      if (historyList.indexOf(placeholderContent) !== -1) {
        historyList.splice(historyList.indexOf(placeholderContent), 1)
      }
      historyList.unshift(placeholderContent);
      this.setData({
        historyList
      })
      wx.setStorageSync('searchHistory', this.data.historyList);
    }else{
      // 将搜索的关键字添加到搜索历史记录中
      if (historyList.indexOf(searchContent) !== -1) {
        historyList.splice(historyList.indexOf(searchContent), 1)
      }
      historyList.unshift(searchContent);
      this.setData({
        historyList
      })
      wx.setStorageSync('searchHistory', this.data.historyList);
    }
    this.getPlayList();
    //播放列表切换歌曲
    PubSub.subscribe('searchPindex', (msg, index) => {
      let searchList = this.data.searchList;
      let musicId = searchList[index].id;
      // 更新下标
      this.setData({
        index
      })
      PubSub.publish('searchMusicId', musicId)
    })

    // 订阅来自songDetail页面发布的消息，上下首切换
    PubSub.subscribe('searchSwitchType', (msg, obj) => {
      let { searchList, index } = this.data;
      //列表播放
      if (obj.temp === 0) {
        if (obj.type === 'pre') { // 上一首
          (index === 0) && (index = searchList.length);
          index -= 1;
        } else if (obj.type === 'next') { // 下一首
          (index === searchList.length - 1) && (index = -1);
          index += 1;
        };
        //单曲循环
      } else if (obj.temp === 1) {
        if (obj.type === 'pre') { // 上一首
          (index === 0);
          index;
        } else if (obj.type === 'next') { // 下一首
          (index === searchList.length - 1);
          index;
        };
        //随机播放
      } else if (obj.temp === -1) {
        if (obj.type === 'pre') { // 上一首
          index = this.randomNum(-1, searchList.length - 1)
        } else if (obj.type === 'next') { // 下一首
          index = this.randomNum(-1, searchList.length - 1)
        };
      }
      // 更新下标
      this.setData({
        index
      })
      let musicId = searchList[index].id;
      // 将musicId回传给songDetail页面
      PubSub.publish('searchMusicId', musicId)
    });
  },

  async getPlayList(){
    let {searchContent} = this.data
    let songPic = [];
    let searchListData = await request('/search', { keywords: searchContent,limit:15});
    if (searchListData.result.songs.length == null) {
      that.setData({
        notFound: true
      })
    }
    this.setData({
      searchList: searchListData.result.songs
    })
    for (let i = 0; i < searchListData.result.songs.length; i++) {
      let ids = searchListData.result.songs[i].id
      let songPicData = await request('/song/detail', { ids });
      await songPic.push(songPicData.songs[0].al.picUrl);
    }
    this.setData({
      songPic
    })
  },
  // 点击播放按钮
  playBtn(e) {
    let index = e.currentTarget.dataset.index;
    let id = e.currentTarget.dataset.id
    let { searchContent } = this.data
    this.setData({
      index
    })
    // 路由跳转传参： query参数
    wx.navigateTo({
      // 不能直接将song对象作为参数传递，长度过长，会被自动截取掉
      // url: '/pages/songDetail/songDetail?songPackage=' + JSON.stringify(songPackage)
      url: '/pages/songDetail/songDetail?musicId=' + id + '&type=search&s=' + searchContent
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
