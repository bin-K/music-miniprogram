import PubSub from 'pubsub-js';
import moment from 'moment'
import request from '../../utils/request'
// 创建控制音乐播放的实例
const innerAudioContext = wx.createInnerAudioContext();
//判断是否第一次进入播放页面
let flag = 0;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: false, // 音乐是否播放
    song: {}, // 歌曲详情对象
    musicId: '', // 音乐id
    musicLink: '', // 音乐的链接
    currentTime: '00:00',  // 实时时间
    durationTime: '00:00', // 总时长
    firstPlay: true, //判断是否为第一次播放
    playList: [],//当前播放列表
    temp: 0,//标识不同播放模式的下标
    playMode: 'icon-iconsMusicyemianbofangmoshiRepeat'//播放模式
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let musicId = options.musicId;
    this.setData({
      musicId,
    })
    // 获取音乐详情
    this.getMusicInfo(musicId);
    this.handleMusicPlay();
  },

  // 获取音乐详情的功能函数
  async getMusicInfo(musicId) {
    let songData = await request('/song/detail', { ids: musicId });
    // songData.songs[0].dt 单位ms
    let durationTime = moment(songData.songs[0].dt).format('mm:ss');
    this.setData({
      song: songData.songs[0],
      durationTime
    })
    // 动态修改窗口标题
    wx.setNavigationBarTitle({
      title: this.data.song.ar[0].name + '--' + this.data.song.name
    })
  },
  // 点击播放/暂停的回调
  handleMusicPlay() {
    let isPlay = !this.data.isPlay;
    let { musicId, musicLink } = this.data;
    this.musicControl(isPlay, musicId, musicLink);
  },

  // 控制音乐播放/暂停的功能函数
  async musicControl(isPlay, musicId, musicLink) {
    if (isPlay) { // 音乐播放
      if(musicLink === 1){
        musicLink = ''
        this.setData({
          musicLink
        })
      }else if (!musicLink) {
        // 获取音乐播放链接
        let musicLinkData = await request('/song/url', { id: musicId });
        musicLink = musicLinkData.data[0].url;
        this.setData({
          musicLink
        })
      }
      innerAudioContext.src = musicLink
      innerAudioContext.title = this.data.song.name;
      if (this.data.firstPlay) {
        innerAudioContext.autoplay = true;
        //首次进入播放页面后将标识改为非第一次进入播放页面
        flag = 1;
      } else {
        innerAudioContext.play()
      }
    } else { // 暂停音乐
      innerAudioContext.pause();
    }
  },

  // 点击切歌的回调
  handleSwitch(event) {
    let musicId = '';
    let switchType = ''
    if (this.options.type === 'recommend'){
      musicId = 'recommendMusicId'
      switchType = 'recommendSwitchType'
    } else if (this.options.type === 'search') {
      musicId = 'searchMusicId'
      switchType = 'searchSwitchType'
    } else if (this.options.type === 'personalized'){
      musicId = 'personalizedMusicId'
      switchType = 'personalizedSwitchType'
    } else if (this.options.type === 'FM') {
      musicId = 'FMMusicId'
      switchType = 'FMSwitchType'
    }
    // 获取切歌的类型
    let type = event.currentTarget.id;
    let temp = this.data.temp;
    // 关闭当前播放的音乐
    innerAudioContext.stop();
    this.setData({
      firstPlay: true
    })
    // 订阅来自recommendSong页面发布的musicId消息
    PubSub.subscribe(musicId, (msg, musicId) => {
      // 获取音乐详情信息
      this.getMusicInfo(musicId);
      //单曲循环播放需要加时间戳
      if (temp === 1) {
        // 自动播放当前的音乐
        this.musicControl(true, musicId, 1);
      } else {
        // 自动播放当前的音乐
        this.musicControl(true, musicId);
      }
      this.setData({
        musicId
      })
      // 取消订阅
      PubSub.unsubscribe(musicId);
    })
    // 发布消息数据给recommendSong页面
    PubSub.publish(switchType, { type, temp })
  },

  //获取播放清单
  async getplayList() {
    let playListData = []
    if(this.options.type === 'recommend'){
      playListData = await request('/recommend/songs');
      this.setData({
        playList: playListData.recommend
      })
    } else if (this.options.type === 'search'){
      playListData = await request('/search', { keywords: this.options.s, limit: 15 });
      this.setData({
        playList: playListData.result.songs
      })
    } else if (this.options.type === 'personalized'){
      playListData = await request('/playlist/detail', { id:this.options.p });
      this.setData({
        playList: playListData.playlist.tracks
      })
    } else if (this.options.type === 'FM'){
      playListData = await request('/personal_fm');
      this.setData({
        playList: playListData.data
      })
    }
  },
  // 播放清单
  playList(e) {
    var currentStatu = e.currentTarget.dataset.statu;
    this.util(currentStatu);
  },
  util: function (currentStatu) {
    /* 动画部分 */
    // 第1步：创建动画实例 
    var animation = wx.createAnimation({
      duration: 300, //动画时长
      timingFunction: "linear", //线性
      delay: 0 //0则不延迟
    });

    // 第2步：这个动画实例赋给当前的动画实例
    this.animation = animation;

    // 第3步：执行第一组动画：Y轴偏移325px后(盒子高度是325px)，停
    animation.translateY(500).step();

    // 第4步：导出动画对象赋给数据对象储存
    this.setData({
      animationData: animation.export()
    })

    // 第5步：设置定时器到指定时候后，执行第二组动画
    setTimeout(function () {
      // 执行第二组动画：Y轴不偏移，停
      animation.translateY(0).step()
      // 给数据对象储存的第一组动画，更替为执行完第二组动画的动画对象
      this.setData({
        animationData: animation
      })

      //关闭抽屉
      if (currentStatu == "close") {
        this.setData({
          showModalStatus: false
        });
      }
    }.bind(this), 300)

    // 显示抽屉
    if (currentStatu == "open") {
      this.setData({
        showModalStatus: true
      });
    }
  },
  //当前播放歌单点击其他歌曲
  currentPlayBtn(e) {
    let musicId = '';
    let Pindex = ''
    if (this.options.type === 'recommend') {
      musicId = 'recommendMusicId'
      Pindex = 'recommendPindex'
    } else if (this.options.type === 'search'){
      musicId = 'searchMusicId'
      Pindex = 'searchPindex'
    } else if (this.options.type === 'personalized') {
      musicId = 'personalizedMusicId'
      Pindex = 'personalizedPindex'
    } else if (this.options.type === 'FM') {
      musicId = 'FMMusicId'
      Pindex = 'FMPindex'
    }
    let index = e.currentTarget.dataset.index
    // 关闭当前播放的音乐
    innerAudioContext.stop();
    this.setData({
      firstPlay: true
    })
    // 订阅来自recommendSong页面发布的musicId消息
    PubSub.subscribe(musicId, (msg, musicId) => {
      // console.log(musicId);
      // 获取音乐详情信息
      this.getMusicInfo(musicId);
      // 自动播放当前的音乐
      this.musicControl(true, musicId);
      this.setData({
        musicId
      })
      // 取消订阅
      PubSub.unsubscribe(musicId);
    })
    PubSub.publish(Pindex, index);
  },
  // 切换播放播放模式
  toggle(e) {
    this.setData({
      temp: e.currentTarget.dataset.index + 1
    })
    if (this.data.temp === 1) {
      this.setData({
        playMode: 'icon-iconsMusicyemianbofangmoshiAlrepeatOne'
      })
    } else if (this.data.temp === 2) {
      this.setData({
        playMode: 'icon-iconsMusicyemianbofangmoshiShuffle',
        temp: -1
      })
    } else if (this.data.temp === 0) {
      this.setData({
        playMode: 'icon-iconsMusicyemianbofangmoshiRepeat',
      })
    }

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
    innerAudioContext.onPlay(() => {
      this.changePlayState(true);
    });
    innerAudioContext.onPause(() => {
      this.changePlayState(false);
    });
    innerAudioContext.onStop(() => {
      this.changePlayState(false);
    });
    // 监听音乐播放自然结束
    innerAudioContext.onEnded(() => {
      let temp = this.data.temp;
      // 关闭当前播放的音乐
      innerAudioContext.stop();
      this.setData({
        firstPlay: true
      })
      // // 订阅来自recommendSong页面发布的musicId消息
      PubSub.subscribe('musicId', (msg, musicId) => {
        // console.log(musicId);
        // 获取音乐详情信息
        this.getMusicInfo(musicId);
        // 自动播放当前的音乐
        this.musicControl(true, musicId);
        this.setData({
          musicId
        })
        // 取消订阅
        PubSub.unsubscribe('musicId');
      })
      // 自动切换至下一首音乐，并且自动播放
      PubSub.publish('switchType', { type:'next', temp })
      this.setData({
        currentWidth: 0,
        currentTime: '00:00'
      })
    });
    // 监听音乐实时播放的进度
    innerAudioContext.onTimeUpdate(() => {
      // 格式化实时的播放时间
      let currentTime = moment(innerAudioContext.currentTime * 1000).format('mm:ss')
      let percent = innerAudioContext.currentTime / innerAudioContext.duration * 100
      this.setData({
        currentTime,
        percent,
      })
      if (flag !== 0) {
        if (currentTime !== '00:00') {
          this.setData({
            firstPlay: false
          })
        } if (percent === 1) {
          this.setData({
            firstPlay: true
          })
        }
      }
    });
    this.getplayList();
  },
  sliderChange(e) {
    innerAudioContext.pause()
    innerAudioContext.seek(e.detail.value * 0.01 * innerAudioContext.duration)
    innerAudioContext.onSeeked(() => {
      innerAudioContext.play()
    })
  },
  // 修改播放状态的功能函数
  changePlayState(isPlay) {
    // 修改音乐是否的状态
    this.setData({
      isPlay
    })
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
