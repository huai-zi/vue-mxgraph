<!--  -->
<template>
  <div>
    <table style="position:relative;">
      <tr>
        <td>
          <div id="graphContainer"
            style="border: solid 1px black;overflow:hidden;width:321px;height:241px;cursor:default;">
          </div>
        </td>
        <td valign="top">
          <div id="properties" style="border: solid 1px black; padding: 10px;">
          </div>
        </td>
      </tr>
    </table>
    <textarea rows="24" cols="100" id="textarea" placeholder="mxGraphModel" v-model='textArea'></textarea>
    <br />
    <button @click="show();">Show</button>
    <div id="graph"></div>
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
  let model = {
    data() {
      return {
        graph: '',
        textArea: '',
      };
    },
    components: {},
    computed: {},
    mounted() {
      var graph = new mxGraph(document.getElementById('graph'));
      graph.resizeContainer = true;
      graph.setEnabled(false);
      this.graph = graph;
      this.main(document.getElementById('graphContainer'))
    },
    methods: {
      show(data = this.textArea) {
        let graph = this.graph;

        var xmlDoc = mxUtils.parseXml(data);
        var codec = new mxCodec(xmlDoc);
        console.log(codec);
        codec.decode(xmlDoc.documentElement, graph.getModel());
      }
    }
  }
  export default model

  model.methods.main = (container) => {
    console.log(this);
    // Checks if the browser is supported
    if (!mxClient.isBrowserSupported()) {
      // Displays an error message if the browser is not supported.
      mxUtils.error('Browser is not supported!', 200, false);
    } else {
      // Note that these XML nodes will be enclosing the
      // mxCell nodes for the model cells in the output
      var doc = mxUtils.createXmlDocument();

      var person1 = doc.createElement('Person');
      person1.setAttribute('firstName', 'Daffy');
      person1.setAttribute('lastName', 'Duck');

      var person2 = doc.createElement('Person');
      person2.setAttribute('firstName', '');
      person2.setAttribute('lastName', '');
      person2.setAttribute('ace', '');
      console.log(person2);

      var relation = doc.createElement('Knows');
      relation.setAttribute('since', '1985');

      // Creates the graph inside the given container
      var graph = new mxGraph(container);

      // Optional disabling of sizing
      graph.setCellsResizable(false);

      // Configures the graph contains to resize and
      // add a border at the bottom, right
      graph.setResizeContainer(true);
      graph.minimumContainerSize = new mxRectangle(0, 0, 500, 380);
      graph.setBorder(60);

      // Stops editing on enter key, handles escape
      new mxKeyHandler(graph);

      // Overrides method to disallow edge label editing
      graph.isCellEditable = function (cell) {
        return !this.getModel().isEdge(cell);
      };

      // Overrides method to provide a cell label in the display
      graph.convertValueToString = function (cell) {
        console.log(1);
        if (mxUtils.isNode(cell.value)) {
          if (cell.value.nodeName.toLowerCase() == 'person') {
            var firstName = cell.getAttribute('firstName', '');
            var lastName = cell.getAttribute('lastName', '');

            if (lastName != null && lastName.length > 0) {
              return lastName + ', ' + firstName;
            }

            return firstName;
          } else if (cell.value.nodeName.toLowerCase() == 'knows') {
            return cell.value.nodeName + ' (Since ' +
              cell.getAttribute('since', '') + ')';
          }

        }

        return '';
      };

      // Overrides method to store a cell label in the model
      var cellLabelChanged = graph.cellLabelChanged;
      graph.cellLabelChanged = function (cell, newValue, autoSize) {
        console.log(2);
        if (mxUtils.isNode(cell.value) &&
          cell.value.nodeName.toLowerCase() == 'person') {
          var pos = newValue.indexOf(' ');

          var firstName = (pos > 0) ? newValue.substring(0,
            pos) : newValue;
          var lastName = (pos > 0) ? newValue.substring(
            pos + 1, newValue.length) : '';

          // Clones the value for correct undo/redo
          var elt = cell.value.cloneNode(true);

          elt.setAttribute('firstName', firstName);
          elt.setAttribute('lastName', lastName);

          newValue = elt;
          // autoSize = true;
        }
        cellLabelChanged.apply(this, arguments);
      };

      // Overrides method to create the editing value
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

      // Adds a special tooltip for edges
      graph.setTooltips(true);

      var getTooltipForCell = graph.getTooltipForCell;
      graph.getTooltipForCell = function (cell) {
        // Adds some relation details for edges
        if (graph.getModel().isEdge(cell)) {
          var src = this.getLabel(this.getModel().getTerminal(cell, true));
          var trg = this.getLabel(this.getModel().getTerminal(cell, false));

          return src + ' ' + cell.value.nodeName + ' ' + trg;
        }

        return getTooltipForCell.apply(this, arguments);
      };

      // Enables rubberband selection
      new mxRubberband(graph);

      // Adds an option to view the XML of the graph
      document.body.appendChild(mxUtils.button('View XML', function () {
        var encoder = new mxCodec();
        var node = encoder.encode(graph.getModel());
        mxUtils.popup(mxUtils.getPrettyXml(node), true);
      }));

      // Changes the style for match the markup
      // Creates the default style for vertices
      var style = graph.getStylesheet().getDefaultVertexStyle();
      style[mxConstants.STYLE_STROKECOLOR] = 'gray';
      style[mxConstants.STYLE_ROUNDED] = true;
      style[mxConstants.STYLE_SHADOW] = true;
      style[mxConstants.STYLE_FILLCOLOR] = '#DFDFDF';
      style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
      style[mxConstants.STYLE_FONTCOLOR] = 'black';
      style[mxConstants.STYLE_FONTSIZE] = '12';
      style[mxConstants.STYLE_SPACING] = 4;

      // Creates the default style for edges
      style = graph.getStylesheet().getDefaultEdgeStyle();
      style[mxConstants.STYLE_STROKECOLOR] = '#0C0C0C';
      style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'white';
      style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
      style[mxConstants.STYLE_ROUNDED] = true;
      style[mxConstants.STYLE_FONTCOLOR] = 'black';
      style[mxConstants.STYLE_FONTSIZE] = '10';

      // Gets the default parent for inserting new cells. This
      // is normally the first child of the root (ie. layer 0).
      var parent = graph.getDefaultParent();

      // Adds cells to the model in a single step
      graph.getModel().beginUpdate();
      try {
        var v1 = graph.insertVertex(parent, null, person1, 40, 40, 80, 30);
        var v2 = graph.insertVertex(parent, null, person2, 200, 150, 80, 30);
        var e1 = graph.insertEdge(parent, null, relation, v1, v2);
      } finally {
        // Updates the display
        graph.getModel().endUpdate();
      }

      // Implements a properties panel that uses
      // mxCellAttributeChange to change properties
      graph.getSelectionModel().addListener(mxEvent.CHANGE, function (sender, evt) {
        selectionChanged(graph);
      });

      selectionChanged(graph);
    }

    /**
     * Updates the properties panel
     */
    function selectionChanged(graph) {
      var div = document.getElementById('properties');
      // Forces focusout in IE
      graph.container.focus();

      // Clears the DIV the non-DOM way
      div.innerHTML = '';

      // Gets the selection cell
      var cell = graph.getSelectionCell();
      console.log(cell);
      if (cell == null) {
        mxUtils.writeln(div, 'Nothing selected.');
      } else {
        // Writes the title
        console.log(cell);
        var center = document.createElement('center');
        mxUtils.writeln(center, cell.value.nodeName + ' (' + cell.id + ')');
        div.appendChild(center);
        mxUtils.br(div);

        // Creates the form from the attributes of the user object
        var form = new mxForm();

        var attrs = cell.value.attributes;
        for (var i = 0; i < attrs.length; i++) {
          createTextField(graph, form, cell, attrs[i]);
        }

        div.appendChild(form.getTable());
        mxUtils.br(div);
      }
    }

    /**
     * Creates the textfield for the given property.
     */
    function createTextField(graph, form, cell, attribute) {
      var input = form.addText(attribute.nodeName + ':', attribute.nodeValue);
      var applyHandler = function () {
        var newValue = input.value || '';
        var oldValue = cell.getAttribute(attribute.nodeName, '');
        console.log('newValue', newValue)
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
        // Note: Known problem is the blurring of fields in
        // Firefox by changing the selection, in which case
        // no event is fired in FF and the change is lost.
        // As a workaround you should use a local variable
        // that stores the focused field and invoke blur
        // explicitely where we do the graph.focus above.
        mxEvent.addListener(input, 'blur', applyHandler);
      }
    }
  };

</script>

<style scoped>
  #graph {
    width: 500px;
    height: 500px;
  }

</style>
