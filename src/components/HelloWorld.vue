<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div class="flexContent">
      <div class="leftDragWindows">

      </div>
      <div class="centerExhibition" ref="graph_container">

      </div>
      <div class="rightEdit">
        <p>
          <button @click='editColor'>修改样式</button>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
  import myClass from '@/util'
  import {
    mxGraph
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
      console.log(myCla.names);
      myCla.names = '我是存值函数'

      // Creates the graph inside the given container
      var graph = new mxGraph(this.$refs.graph_container);
      this.graph = graph;
      graph.setConnectable(true);

      // Specifies the default edge style
      graph.getStylesheet().getDefaultEdgeStyle()['edgeStyle'] = 'orthogonalEdgeStyle';

      // Gets the default parent for inserting new cells. This
      // is normally the first child of the root (ie. layer 0).
      var parent = graph.getDefaultParent();

      // Adds cells to the model in a single step
      graph.getModel().beginUpdate();
      try {
        var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
        var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
        var e1 = graph.insertEdge(parent, null, '', v1, v2);
      } finally {
        // Updates the display
        graph.getModel().endUpdate();
      }

    },
    methods: {
      editColor() {
        // 修改颜色
        let graph = this.graph;
        graph.getView().updateStyle = true;
        // Gets the default parent for inserting new cells. This
        // is normally the first child of the root (ie. layer 0).
        var parent = graph.getDefaultParent();

        // Adds cells to the model in a single step
        graph.getModel().beginUpdate();
        try {
          var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30, 'fillColor=green');
          var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30, 'fillColor=blue');
          var v3 = graph.insertVertex(parent, null, 'World!', 20, 150, 80, 30, 'fillColor=red');
          var e1 = graph.insertEdge(parent, null, 'Connect', v1, v2,
            'perimeterSpacing=4;strokeWidth=4;labelBackgroundColor=white;fontStyle=1');
        } finally {
          // Updates the display
          graph.getModel().endUpdate();
        }
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
    width: 20%;
    height: 100%;
    border: 1px solid red
  }

  .centerExhibition {
    width: 60%;
    height: 100%;
    border: 1px solid blue;
  }

  .rightEdit {
    width: 20%;
    height: 100%;
    border: 1px solid green;
  }

</style>
