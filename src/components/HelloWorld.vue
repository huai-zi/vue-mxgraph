<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div class="flexContent">
      <div class="leftDragWindows" ref='leftDragWindows'>

      </div>
      <div class="centerExhibition" ref="graph_container">

      </div>
      <div class="rightEdit">
        <!-- 带样式的图形框 -->
        <p>
          <button @click='editColor'>修改样式</button>
        </p>

        <p>
          <button @click='zoomIn'>放大按钮</button>
          <button @click='zoomOut'>缩小按钮</button>
        </p>

        <p>
          <button @click='exportXml'>导出XML</button>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
  import myClass from '@/util'
  import 'mxgraph/javascript/src/css/common.css'
  import 'mxgraph/javascript/src/css/explorer.css'

  import {
    mxGraph,
    mxRubberband,
    mxClient,
    mxCell,
    mxGraphModel,
    mxRectangle,
    mxUtils,
    mxPoint,
    mxEvent,
    mxCodec,
    mxImage,
    mxConnectionHandler,
    mxGeometry,
    mxEventSource,
    mxToolbar
  } from 'mxgraph/javascript/mxClient';

  export default {
    name: 'HelloWorld',
    data() {
      return {
        msg: 'vue-mxgraph',
        graph: ''
      }
    },
    mounted() {
      let myCla = new myClass(123)
      myCla.names = '我是存值函数'

      // 连接中间线
      mxConnectionHandler.prototype.connectImage = new mxImage(require('../assets/connector.gif'), 16, 16);

      // 在绘制区域，禁止鼠标右键出现菜单栏
      mxEvent.disableContextMenu(this.$refs.graph_container);

      // 兼容多平台模型
      var model = new mxGraphModel();
      // 创建图形
      var graph = new mxGraph(this.$refs.graph_container, model);

      // 禁用选中图标进行连线
      // graph.panningHandler.ignoreCell = true;

      // 支持无限拖动

      graph.setPanning(true);

      // 目标支持宽度
      graph.scrollTileSize = new mxRectangle(0, 0, document.body.scrollWidth, 800);
      this.scrollInfinite(graph)

      graph.dropEnabled = true;
      this.graph = graph;
      graph.setConnectable(true);
      // 控制鼠标多选
      var rubberband = new mxRubberband(graph);

      // 边缘样式
      graph.getStylesheet().getDefaultEdgeStyle()['edgeStyle'] = 'orthogonalEdgeStyle';

      // 获取默认组件
      var parent = graph.getDefaultParent();

      // 开启更新事务
      graph.getModel().beginUpdate();
      try {
        var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
        var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
        var e1 = graph.insertEdge(parent, null, '', v1, v2);
      } finally {
        // 结束更新事务
        graph.getModel().endUpdate();
      }

      this.createToolbar();
    },
    methods: {
      editColor() {
        // 创建图形

        let graph = this.graph;
        graph.getView().updateStyle = true;

        // 创建默认窗体
        var parent = graph.getDefaultParent();

        // 控制鼠标多选
        // // 设置可以连接属性
        // graph.setConnectable(true);
        // // 设置多重图
        // graph.setMultigraph(false);

        // 开启更新事务
        graph.getModel().beginUpdate();
        try {
          var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30, 'fillColor=green');
          var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30, 'fillColor=blue');
          var v3 = graph.insertVertex(parent, null, 'World!', 20, 150, 80, 30, 'fillColor=red');
          var e1 = graph.insertEdge(parent, null, 'Connect', v1, v2,
            'perimeterSpacing=4;strokeWidth=4;labelBackgroundColor=white;fontStyle=1');
        } finally {
          // 结束更新事务
          graph.getModel().endUpdate();
        }
      },
      zoomIn() {
        // 图形放大
        this.graph.zoomIn()
      },
      zoomOut() {
        // 图形缩小
        this.graph.zoomOut()
      },
      exportXml() {
        // 导出xml

        var encoder = new mxCodec();
        var node = encoder.encode(this.graph.getModel());
        console.log(mxUtils.getXml(node));
        mxUtils.popup(mxUtils.getXml(node), true);
      },
      createToolbar() {
        /**
         * 创建菜单栏
         * 1.图形图标
         * 2.长
         * 3.宽
         * 4.图形形状，有则展示，无则显示图形图标
         */
        this.addVertex(require('../assets/rectangle.gif'), 200, 200, '');
      },
      addVertex(icon, w, h, style) {
        // 宽高，指的是，拉出来后图形的大小

        var toolbar = new mxToolbar(this.$refs.leftDragWindows);
        toolbar.enabled = false
        var vertex = new mxCell(null, new mxGeometry(0, 0, w, h), style);
        vertex.setVertex(true);

        var img = this.addToolbarItem(this.graph, toolbar, vertex, icon);
        img.enabled = true;

        // 图标拖动到场景内，进行激活
        this.graph.getSelectionModel().addListener(mxEvent.CHANGE, () => {
          var tmp = this.graph.isSelectionEmpty();

          // 拖动图标，编辑状态下，图标变灰
          // mxUtils.setOpacity(img, (tmp) ? 100 : 20);
          img.enabled = tmp;
        });
      },
      addToolbarItem(graph, toolbar, prototype, image) {
        // 绘制img图形
        //删除图像时执行的函数

        //图表。cell参数指向下面的单元格

        //鼠标指针（如果有）
        var funct = function (graph, evt, cell, x, y) {
          graph.stopEditing(false);

          var vertex = graph.getModel().cloneCell(prototype);
          vertex.geometry.x = x;
          vertex.geometry.y = y;

          graph.addCell(vertex);
          graph.setSelectionCell(vertex);
        }

        // 创建用作拖动图标的图像（预览）
        var img = toolbar.addMode(null, image, function (evt, cell) {
          var pt = this.graph.getPointForEvent(evt);
          funct(graph, evt, cell, pt.x, pt.y);
        });

        // Disables dragging if element is disabled. This is a workaround
        // for wrong event order in IE. Following is a dummy listener that
        // is invoked as the last listener in IE.
        mxEvent.addListener(img, 'mousedown', function (evt) {
          // do nothing
          console.log('点击状态栏');
        });


        mxUtils.makeDraggable(img, graph, funct);

        return img;
      },
      scrollInfinite(graph) {
        // 无限滚动
        /**
         * Returns the padding for pages in page view with scrollbars.
         */
        graph.getPagePadding = function () {
          return new mxPoint(Math.max(0, Math.round(graph.container.offsetWidth - 34)),
            Math.max(0, Math.round(graph.container.offsetHeight - 34)));
        };

        /**
         * Returns the size of the page format scaled with the page size.
         */
        graph.getPageSize = function () {
          return (this.pageVisible) ? new mxRectangle(0, 0, this.pageFormat.width * this.pageScale,
            this.pageFormat.height * this.pageScale) : this.scrollTileSize;
        };

        /**
         * Returns a rectangle describing the position and count of the
         * background pages, where x and y are the position of the top,
         * left page and width and height are the vertical and horizontal
         * page count.
         */
        graph.getPageLayout = function () {
          var size = (this.pageVisible) ? this.getPageSize() : this.scrollTileSize;
          var bounds = this.getGraphBounds();

          if (bounds.width == 0 || bounds.height == 0) {
            return new mxRectangle(0, 0, 1, 1);
          } else {
            // Computes untransformed graph bounds
            var x = Math.ceil(bounds.x / this.view.scale - this.view.translate.x);
            var y = Math.ceil(bounds.y / this.view.scale - this.view.translate.y);
            var w = Math.floor(bounds.width / this.view.scale);
            var h = Math.floor(bounds.height / this.view.scale);

            var x0 = Math.floor(x / size.width);
            var y0 = Math.floor(y / size.height);
            var w0 = Math.ceil((x + w) / size.width) - x0;
            var h0 = Math.ceil((y + h) / size.height) - y0;

            return new mxRectangle(x0, y0, w0, h0);
          }
        };

        // Fits the number of background pages to the graph
        graph.view.getBackgroundPageBounds = function () {
          var layout = this.graph.getPageLayout();
          var page = this.graph.getPageSize();

          return new mxRectangle(this.scale * (this.translate.x + layout.x * page.width),
            this.scale * (this.translate.y + layout.y * page.height),
            this.scale * layout.width * page.width,
            this.scale * layout.height * page.height);
        };

        graph.getPreferredPageSize = function (bounds, width, height) {
          var pages = this.getPageLayout();
          var size = this.getPageSize();

          return new mxRectangle(0, 0, pages.width * size.width, pages.height * size.height);
        };


        var graphSizeDidChange = graph.sizeDidChange;
        graph.sizeDidChange = function () {
          if (this.container != null && mxUtils.hasScrollbars(this.container)) {
            var pages = this.getPageLayout();
            var pad = this.getPagePadding();
            var size = this.getPageSize();

            // Updates the minimum graph size
            var minw = Math.ceil(2 * pad.x / this.view.scale + pages.width * size.width);
            var minh = Math.ceil(2 * pad.y / this.view.scale + pages.height * size.height);

            var min = graph.minimumGraphSize;

            // LATER: Fix flicker of scrollbar size in IE quirks mode
            // after delayed call in window.resize event handler
            if (min == null || min.width != minw || min.height != minh) {
              graph.minimumGraphSize = new mxRectangle(0, 0, minw, minh);
            }

            // Updates auto-translate to include padding and graph size
            var dx = pad.x / this.view.scale - pages.x * size.width;
            var dy = pad.y / this.view.scale - pages.y * size.height;

            if (!this.autoTranslate && (this.view.translate.x != dx || this.view.translate.y != dy)) {
              this.autoTranslate = true;
              this.view.x0 = pages.x;
              this.view.y0 = pages.y;

              // NOTE: THIS INVOKES THIS METHOD AGAIN. UNFORTUNATELY THERE IS NO WAY AROUND THIS SINCE THE
              // BOUNDS ARE KNOWN AFTER THE VALIDATION AND SETTING THE TRANSLATE TRIGGERS A REVALIDATION.
              // SHOULD MOVE TRANSLATE/SCALE TO VIEW.
              var tx = graph.view.translate.x;
              var ty = graph.view.translate.y;

              graph.view.setTranslate(dx, dy);
              graph.container.scrollLeft += (dx - tx) * graph.view.scale;
              graph.container.scrollTop += (dy - ty) * graph.view.scale;

              this.autoTranslate = false;
              return;
            }

            graphSizeDidChange.apply(this, arguments);
          }
        };
      }
    }
  }

</script>

<style scoped>
  .hello {
    height: 100%;
    overflow: hidden;
  }

  h1 {
    margin: 20px;
  }

  .flexContent {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: calc(100% - 82px);
  }

  .leftDragWindows {
    width: 5%;
    height: 100%;
    border: 1px solid red
  }

  .centerExhibition {
    width: 75%;
    height: 100%;
    border: 1px solid blue;
    background-image: url('../assets/grid.gif');
    overflow: auto;
  }

  .rightEdit {
    width: 20%;
    height: 100%;
    border: 1px solid green;
  }

  /* mxgraph选择框样式 */
  /* .mxRubberband {
    position: absolute;
    background-color: #2196f3;
    border: 1px solid #0043ff;
  } */

</style>
