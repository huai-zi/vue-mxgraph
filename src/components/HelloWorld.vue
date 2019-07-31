<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div class="flexContent">
      <div class="leftDragWindows" ref='leftDragWindows'>

      </div>
      <div class="centerExhibition" ref="graph_container">

      </div>
      <div class="rightEdit">
        <p>
          <button @click='undo'>撤销操作（返回上一步）</button>
        </p>
        <p>
          <button @click='redo'>还原操作（返回下一步）</button>
        </p>

        <!-- 带样式的图形框 -->
        <p>
          <button @click='editColor'>创建有样式的窗口</button>
        </p>

        <p>
          <button @click='zoomIn'>放大按钮</button>
          <button @click='zoomOut'>缩小按钮</button>
        </p>

        <p>
          <button @click='exportXml'>导出XML</button>
        </p>

        <p>
          <button @click='deleteLine'>删除</button>
        </p>

        <p>
          <button @click='dynamicLoadXml'>动态加载图形</button>
        </p>
        <span id="errorT">

        </span>
        <p v-show='valuesTypes'> aaa:<input type="text" class="aaa" v-model='values.aaa'><br>
          ccc:<input type="text" class="ccc" v-model='values.ccc'></p>
        <p v-show='resetName'>重命名：<input type="text" v-model='cellValue' @blur='cellBlur'></p>

      </div>
    </div>
  </div>
</template>

<script>
  import myClass from '@/util'
  import dqKeys from '@/util/keyCodeComponent'

  import {
    mxGraph,
    mxRubberband,
    mxClient,
    mxCell,
    mxGraphModel,
    mxRectangle,
    mxUtils,
    mxUndoManager,
    mxFastOrganicLayout,
    mxPoint,
    mxEvent,
    mxStencil,
    mxEdgeStyle,
    mxCodec,
    mxEditor,
    mxKeyHandler,
    mxForm,
    mxConstants,
    mxPerimeter,
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
        graph: '',
        cellValue: '',
        cellNode: '',
        valuesTypes: false,
        resetName: false,
        values: {
          aaa: '',
          ccc: ''
        },
        undoManager: ''
      }
    },
    mounted() {
      let myCla = new myClass(123)
      myCla.names = '我是存值函数'

      this.init();
      // 创建状态栏
      this.createToolbar();
    },
    methods: {
      init() {
        // 初始化图形渲染

        mxConstants.SHADOWCOLOR = '#C0C0C0';
        // 连接中间线
        mxConnectionHandler.prototype.connectImage = new mxImage(require('../assets/connector.gif'), 16, 16);

        // 在绘制区域，禁止鼠标右键出现菜单栏
        mxEvent.disableContextMenu(this.$refs.graph_container);

        // 兼容多平台模型
        var model = new mxGraphModel();
        // 创建图形
        var graph = new mxGraph(this.$refs.graph_container, model);
        this.styleY(graph)
        // 禁用选中图标进行连线
        // graph.panningHandler.ignoreCell = true;

        // 区域边框
        // graph.pageBreaksVisible = true;
        // graph.pageFormat.src = require('../assets/grid.gif')

        // 禁止在图标上进行窗口拖动，左键选中，右键拖动窗口
        // graph.setCellsMovable(false);

        // 设置自适应尺寸
        // graph.setAutoSizeCells(true);

        // graph.setEnabled(false); //设置启用,就是允不允许你改变CELL的形状内容。
        // graph.setPanning(true); //移动镜头


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

        // 创建有树形的图形
        var doc = mxUtils.createXmlDocument();
        var person1 = doc.createElement('Person');
        person1.setAttribute('firstName', 'Daffy');
        person1.setAttribute('lastName', 'Duck');


        var person2 = doc.createElement('Person');
        person2.setAttribute('firstName', '');
        person2.setAttribute('lastName', '');
        person2.setAttribute('ace', '');

        try {
          var v1 = graph.insertVertex(parent, null, person1, 20, 20, 80, 30);
          var v2 = graph.insertVertex(parent, null, person2, 200, 150, 80, 30);
          var e1 = graph.insertEdge(parent, null, '', v1, v2);
        } finally {
          // 结束更新事务
          graph.getModel().endUpdate();
        }


        // 返回上一步 begin
        var undoManager = new mxUndoManager();
        this.undoManager = undoManager;

        var listener = function (sender, evt) {
          undoManager.undoableEditHappened(evt.getProperty('edit'));
        };
        this.graph.getModel().addListener(mxEvent.UNDO, listener);
        this.graph.getView().addListener(mxEvent.UNDO, listener);
        // 返回上一步 end

        // 删除按键监控 begin
        document.onkeydown = () => {
          var oEvent = window.event;
          if (oEvent.keyCode === 46) {
            this.deleteLine()
          }
        }
        // 删除按键监控 end

        // 返回上一步组合按键 begin
        dqKeys({
          'control': 17,
          'z': 90
        }, false, () => {
          this.undo();
        }).listenkeys();
        // 返回上一步组合按键 end

        var editor = new mxEditor();
        // editor.setGraphContainer(this.graph);

        // var config = mxUtils.load(
        //   '../assets/keyhandler-minimal.xml').
        // getDocumentElement();
        // editor.configure(config);

        // editor.layoutSwimlanes = true;

        // Installs a popupmenu handler using local function (see below).
        graph.popupMenuHandler.factoryMethod = (menu, cell, evt) => {
          console.log('右击事件');
          this.createPopupMenu(editor, this.graph, menu, cell, evt);
        };

        // 点击事件
        // graph.addListener(mxEvent.CLICK, (sender, evt) => {

        //   let getId = evt['properties']['cell'] ? evt['properties']['cell']['id'] : null;
        //   let edge = evt['properties']['cell'] ? evt['properties']['cell']['edge'] : false;
        //   // 判断是否是线条，则不进行数据获取
        //   if (edge) {
        //     console.log('是线条');
        //     return
        //   } else {
        //     // 创建图形以及数据清空等操作
        //     console.log('不是线条');
        //   }
        //   console.log(evt['properties']['cell']);
        //   // 单独点击窗体的情况，没有id的情况
        //   if (!getId) {
        //     return
        //   }
        //   // 获取数据等填充数据等操作
        //   console.log(getId);
        // });

        // 改变事件

        //禁用节点双击，禁止改变cell中的值
        graph.dblClick = function (evt, cell) {
          var model = graph.getModel();
          if (model.isVertex(cell)) {
            return false;
          }
        };

        // 禁止改变元素大小
        // graph.setCellsResizable(false);

        graph.minimumContainerSize = new mxRectangle(0, 0, document.body.scrollWidth, 800);
        graph.setBorder(60);

        // Stops editing on enter key, handles escape
        new mxKeyHandler(graph);

        // 禁止边框编辑
        graph.isCellEditable = function (cell) {
          return !this.getModel().isEdge(cell);
        };

        // 提供一个在显示屏上的单元格标签
        graph.convertValueToString = function (cell) {
          console.log('cell :', cell);
          console.log(cell.getStyle());
          if (mxUtils.isNode(cell.value)) {
            if (cell.value.nodeName.toLowerCase() == 'person') {
              let nodeName = cell.getValue().getAttribute('nodeName')
              nodeName ? nodeName : '...';
              return nodeName
            }
          }
          return cell.value ? cell.value.nodeName : '';
        };

        //  存储在模型中的单元格标签，双击修改cell内容进行激活
        var cellLabelChanged = graph.cellLabelChanged;
        graph.cellLabelChanged = function (cell, newValue, autoSize) {
          if (mxUtils.isNode(cell.value) &&
            cell.value.nodeName.toLowerCase() == 'person') {
            var pos = newValue.indexOf(' ');

            var firstName = (pos > 0) ? newValue.substring(0,
              pos) : newValue;
            var lastName = (pos > 0) ? newValue.substring(
              pos + 1, newValue.length) : '';

            // Clones the value for correct undo/redo
            var elt = cell.value.cloneNode(true);
            newValue = elt;
            //是否开启内容自适应
            // autoSize = false;
          }
          cellLabelChanged.apply(this, arguments);
        };

        // 显示编辑值
        var getEditingValue = graph.getEditingValue;
        graph.getEditingValue = function (cell) {
          console.log(3);
          if (mxUtils.isNode(cell.value) &&
            cell.value.nodeName.toLowerCase() == 'person') {
            var firstName = cell.getAttribute('firstName', '');
            var lastName = cell.getAttribute('lastName', '');

            return firstName + ' ' + lastName;
          }
        };

        var cell;
        let _this = this;
        graph.addListener(mxEvent.CLICK, function (sender, evt) {
          cell = evt.getProperty('cell')
          _this.selectionChanged(_this.graph, cell);
        });
        this.selectionChanged(_this.graph, cell);

        // 在边框上显示提示工具 
        graph.setTooltips(true);
        graph.getTooltipForCell = function (cell) {
          if (mxUtils.isNode(cell.value)) {
            if (cell.value.nodeName.toLowerCase() == 'person') {
              let nodeName = cell.getValue().getAttribute('nodeName')
              nodeName ? nodeName : '...';
              return nodeName
            }
          }
        }

        // Defines a new export action
        editor.addAction('properties', (editor, cell) => {
          if (cell == null) {
            cell = this.graph.getSelectionCell();
          }
          this.showProperties(this.graph, cell);
        });

      },
      cellBlur(val) {
        // 重命名
        let cell = this.cellNode;
        if (mxUtils.isNode(cell.value) &&
          cell.value.nodeName.toLowerCase() == 'person') {
          cell.getValue().setAttribute('nodeName', this.cellValue)
        }

        // 刷新面板Graph，否则看不到cell的删除效果
        this.graph.refresh(cell);
        this.resetName = false;
      },
      selectionChanged(graph, cell) {
        // 选择图形，改变数据进行填充
        var div = document.getElementById('errorT');
        // Forces focusout in IE
        graph.container.focus();

        // Clears the DIV the non-DOM way
        div.innerHTML = '';
        // Gets the selection cell

        // var cell = graph.getSelectionCell();
        // 方法graph.view.getState获取图形样式的基本属性
        // graph.view.getState(cell)
        console.log(cell);
        if (cell == null) {
          // 失去焦点，关闭窗口
          mxUtils.writeln(div, 'Nothing selected.');
          this.valuesTypes = false;
          this.resetName = false;
          this.values.aaa = ''
          this.values.ccc = ''

        } else {
          // Writes the title
          var center = document.createElement('center');

          mxUtils.writeln(center, cell.value.nodeName + ' (' + cell.id + ')');
          div.appendChild(center);
          mxUtils.br(div);

          // Creates the form from the attributes of the user object
          var form = new mxForm();
          //表格数据值  
          var attrs = cell.value.attributes;
          console.log(attrs);
          this.valuesTypes = true;

          for (var i = 0; i < attrs.length; i++) {
            this.createTextField(graph, form, cell, attrs[i]);
          }

          div.appendChild(form.getTable());
          mxUtils.br(div);
        }
      },
      createTextField(graph, form, cell, attribute) {
        var input = form.addText(attribute.nodeName + ':', attribute.nodeValue);

        var applyHandler = function () {
          var newValue = input.value || '';
          var oldValue = cell.getAttribute(attribute.nodeName, '');

          if (newValue != oldValue) {
            graph.getModel().beginUpdate();

            try {
              var edit = new mxCellAttributeChange(
                cell, attribute.nodeName,
                newValue);
              graph.getModel().execute(edit);
              graph.updateCellSize(cell);
            } finally {
              graph.getModel().endUpdate();
            }
          }
        };

        mxEvent.addListener(input, 'keypress', function (evt) {
          // Needs to take shift into account for textareas
          if (evt.keyCode == /*enter*/ 13 &&
            !mxEvent.isShiftDown(evt)) {
            input.blur();
          }
        });

        if (mxClient.IS_IE) {
          mxEvent.addListener(input, 'focusout', applyHandler);
        } else {
          mxEvent.addListener(input, 'blur', applyHandler);
        }
      },
      read(graph, filename) {

        var req = mxUtils.load(filename);
        var root = req.getDocumentElement();
        console.log(root);
        var dec = new mxCodec(root.ownerDocument);

        dec.decode(root, graph.getModel());

      },
      dynamicLoadXml() {
        // 动态加载图形
        let graph = this.graph;

        var xmlDoc = mxUtils.parseXml(
          '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><Person firstName="" lastName="" ace="" id="7"><mxCell style="style1" vertex="1" parent="1"><mxGeometry x="73.65625" y="1" width="60" height="60" as="geometry"/></mxCell></Person><mxCell id="8" style="style" vertex="1" parent="1"><Object nodeName="3333" firstName="12" lastName="99" as="value"/><mxGeometry x="294.65625" y="151" width="60" height="60" as="geometry"/></mxCell><mxCell id="9" edge="1" parent="1" source="7" target="8"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel>'
        );
        var codec = new mxCodec(xmlDoc);
        console.log(codec);
        codec.decode(xmlDoc.documentElement, graph.getModel());
        this.selectCell(graph);
      },
      selectCell(graph) {
        // 图形居中
        graph.fit(); //自适应
        // graph.center(true, true, 0.5, 0.5); //将画布放到容器中间
        var sc = graph.getView().getScale(); //获取当前的缩放比例
        graph.zoomTo(Math.round(sc / 2)); //在缩放一半，否则是满屏状态，不好看
      },
      editColor() {
        // 创建图形

        let graph = this.graph;
        graph.getView().updateStyle = true;

        // 创建默认窗体
        var parent = graph.getDefaultParent();

        // 控制鼠标多选
        // // 设置可以连接属性
        graph.setConnectable(true);
        // // 设置多重图
        graph.setMultigraph(false);

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
      styleY(graph) {
        // 创建图形样式
        var style = graph.getStylesheet().getDefaultVertexStyle();
        style[mxConstants.STYLE_FONTSIZE] = 11;
        style[mxConstants.STYLE_FONTCOLOR] = 'black';
        style[mxConstants.STYLE_STROKECOLOR] = '#808080';
        style[mxConstants.STYLE_FILLCOLOR] = 'white';
        style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
        style[mxConstants.STYLE_GRADIENT_DIRECTION] = mxConstants.DIRECTION_EAST;
        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_SHADOW] = true;
        style[mxConstants.STYLE_FONTSTYLE] = 1;

        // cell线条节点样式
        style = graph.getStylesheet().getDefaultEdgeStyle();
        style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
        style[mxConstants.STYLE_STROKECOLOR] = '#808080';
        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_SHADOW] = true;

        style = [];
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_SWIMLANE;
        style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
        style[mxConstants.STYLE_STROKECOLOR] = '#a0a0a0';
        style[mxConstants.STYLE_FONTCOLOR] = '#606060';
        style[mxConstants.STYLE_FILLCOLOR] = '#E0E0DF';
        style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
        style[mxConstants.STYLE_STARTSIZE] = 30;
        style[mxConstants.STYLE_ROUNDED] = false;
        style[mxConstants.STYLE_FONTSIZE] = 12;
        style[mxConstants.STYLE_FONTSTYLE] = 0;
        style[mxConstants.STYLE_HORIZONTAL] = false;
        // To improve text quality for vertical labels in some old IE versions...
        style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#efefef';

        graph.getStylesheet().putCellStyle('swimlane', style);

        style = [];
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RHOMBUS;
        style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RhombusPerimeter;
        style[mxConstants.STYLE_STROKECOLOR] = '#91BCC0';
        style[mxConstants.STYLE_FONTCOLOR] = 'gray';
        style[mxConstants.STYLE_FILLCOLOR] = '#91BCC0';
        style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
        style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
        style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
        style[mxConstants.STYLE_FONTSIZE] = 16;
        graph.getStylesheet().putCellStyle('step', style);

        style = [];
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_ELLIPSE;
        style[mxConstants.STYLE_PERIMETER] = mxPerimeter.EllipsePerimeter;
        style[mxConstants.STYLE_FONTCOLOR] = 'gray';
        style[mxConstants.STYLE_FILLCOLOR] = '#A0C88F';
        style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
        style[mxConstants.STYLE_STROKECOLOR] = '#A0C88F';
        style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
        style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
        style[mxConstants.STYLE_FONTSIZE] = 16;
        graph.getStylesheet().putCellStyle('start', style);

        style = mxUtils.clone(style);
        style[mxConstants.STYLE_FILLCOLOR] = '#DACCBC';
        style[mxConstants.STYLE_STROKECOLOR] = '#AF7F73';
        graph.getStylesheet().putCellStyle('end', style);

      },
      createPopupMenu(editor, graph, menu, cell, evt) {
        // 右键单击创建窗体

        if (cell != null) {

          menu.addItem('重命名', require('../assets/delete2.png'), (sender) => {
            console.log('重名');
            this.cellNode = cell;
            this.resetName = true;
          });

          // menu.addSeparator();
        }
      },
      showProperties(graph, cell) {
        // 右键展示表格数据
        // Creates a form for the user object inside
        // the cell
        console.log(cell);
        let edge = cell['edge'] ? cell['edge'] : false;
        console.log(edge);
        if (edge) {
          console.log('线条');
        } else {
          console.log('不是线条');
        }

        var form = new mxForm('properties');
        // Adds a field for the columnname
        var nameField = form.addText('Name', cell.value);


        var wnd = null;

        var okFunction = function () {
          var clone = cell.value.clone();

          clone.name = nameField.value;
          clone.type = typeField.value;

          wnd.destroy();
        }

        // Defines the function to be executed when the
        // Cancel button is pressed in the dialog
        var cancelFunction = function () {
          wnd.destroy();
        }
        form.addButtons(okFunction, cancelFunction);

        var parent = graph.model.getParent(cell);
        var name = parent.value + '.' + cell.value;
        console.log(form.table);

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
      deleteLine() {
        // 删除选中事务
        this.graph.removeCells()
      },
      undo(undoManager) {
        // 返回上一步
        this.undoManager.undo();
      },
      redo() {
        this.undoManager.redo();
      },
      createToolbar() {
        /**
         * 创建菜单栏，自定义菜单栏
         * 1.图形图标
         * 2.长
         * 3.宽
         * 4.图形形状，有则展示，无则显示图形图标
         */

        var style = this.graph.getStylesheet().getDefaultVertexStyle();
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE;
        style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
        style[mxConstants.STYLE_IMAGE] = require('../assets/delete2.png');
        style[mxConstants.STYLE_IMAGE_WIDTH] = '38';
        style[mxConstants.STYLE_IMAGE_HEIGHT] = '38';
        style[mxConstants.STYLE_FONTCOLOR] = '#000000';
        style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
        style[mxConstants.STYLE_SHADOW] = true;
        style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = 'bottom';
        style[mxConstants.STYLE_VERTICAL_ALIGN] = 'top';
        this.graph.getStylesheet().putCellStyle('style', style);
        // 通过给style创建样式，将参数数组进行传递展示
        this.addVertex(require('../assets/delete2.png'), 60, 60, 'style');

        let style1 = Object.assign({}, style);
        style1['image'] = require('../assets/redo.png');
        this.graph.getStylesheet().putCellStyle('style1', style1);
        // 通过给style创建样式，将参数数组进行传递展示
        this.addVertex(require('../assets/redo.png'), 60, 60, 'style1');

      },
      addVertex(icon, w, h, style) {
        /**
         * 宽高，指的是，拉出来后图形的大小
         * @param {String} icon 图标展示
         * @param {Number} w 高度
         * @param {Number} h 高度
         * @param {String} style 样式
         */

        var toolbar = new mxToolbar(this.$refs.leftDragWindows);
        toolbar.enabled = false

        // 动态数据类型，创建person
        var doc = mxUtils.createXmlDocument();
        var person2 = doc.createElement('Person');
        person2.setAttribute('firstName', '');
        // 名称
        person2.setAttribute('nodeName', '资源');
        person2.setAttribute('lastName', '');
        person2.setAttribute('ace', '');

        /**
         * 拖拽出保存图形 new mxCell()实例解析
         * 第一个参数，创建自定义属性值,cell的值
         * 第二个参数：可选几何形状new mxGeometry(0, 0, w, h)
         * 第三个参数：风格样式style
         */

        var vertex = new mxCell(person2, new mxGeometry(0, 0, w, h), style);

        vertex.setVertex(true);

        var img = this.addToolbarItem(this.graph, toolbar, vertex, icon);
        img.enabled = true;

        // 图标拖动到场景内，进行激活
        this.graph.getSelectionModel().addListener(mxEvent.CHANGE, (sender, evt) => {
          var tmp = this.graph.isSelectionEmpty();
          // 拖动图标，编辑状态下，图标状态栏变灰
          // mxUtils.setOpacity(img, (tmp) ? 100 : 20);
          img.enabled = tmp;
        });
      },
      addToolbarItem(graph, toolbar, prototype, image) {
        // 绘制img图形

        //鼠标指针（如果有）
        var funct = function (graph, evt, cell, x, y) {
          graph.stopEditing(false);
          console.log(prototype);
          var vertex = graph.getModel().cloneCell(prototype);
          vertex.geometry.x = x;
          vertex.geometry.y = y;
          console.log(vertex);
          // 追加到图形展示区域
          graph.addCell(vertex);
          // 创建后选中焦点
          // graph.setSelectionCell(vertex);
        }

        // 创建用作拖动图标的图像（预览）
        var img = toolbar.addMode(null, image, (evt, cell) => {
          var pt = this.graph.getPointForEvent(evt);

          This.funct(graph, evt, cell, pt.x, pt.y);
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
    border: 1px solid red;
  }

  .centerExhibition {
    width: 75%;
    height: 100%;
    border: 1px solid blue;
    /* background-image: url("../assets/grid.gif"); */
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
