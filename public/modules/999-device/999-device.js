/*
 * All these methods below are required to be defined.
 */

var userDevKey = "ac6de837-7863-72a9-c789-a0aae7e9d93e";

function GetNodeInformation_999(uuid) {
  console.log("Send INFO request " + uuid);
  MkSDeviceSendGetRequestWebface(
    {
      url: GetServerUrl(),
      key: userDevKey,
      uuid: uuid,
      cmd: "get_node_info",
      payload: {}
    },
    function(res) {
      //   if (res.errno !== undefined) {
      //     if (res.errno == 10) {
      //       document.getElementById(uuid + "-status-external").innerHTML =
      //         "Disconnected";
      //       document.getElementById(uuid + "-status-external").style.color =
      //         "red";
      //     }
      //   } else {
      //     document.getElementById(uuid + "-status-external").innerHTML =
      //       "Connected";
      //     document.getElementById(uuid + "-status-external").style.color =
      //       "green";
      //   }
    }
  );

  // Context_999.NodeStatusTimer = setInterval(GetNodeStatus_999, Context_999.NodeStatusInterval);
}

function GetNodeStatus_999() {
  console.log("GetNodeStatus_999");
  MkSDeviceSendGetRequestWebface(
    {
      url: GetServerUrl(),
      key: localStorage.getItem("key"),
      uuid: Context_999.uuid,
      cmd: "get_node_status",
      payload: {}
    },
    function(res) {}
  );
}

function SensorHtmlBuildNew_999(data) {
  var html = "";
  switch (data.sensor.type) {
    case "Switch":
      var switchTextValue = "";

      if (1 == data.sensor.value) {
        switchTextValue = "On";
      } else {
        switchTextValue = "Off";
      }

      html +=
        '<tr id="' +
        data.sensor.uuid +
        '">' +
        "<td>" +
        (i + 1) +
        "</td>" +
        '<td><img width="25px" src="../images/basic_sensors/switch.png"/></td>' +
        '<td><label id="' +
        data.sensor.uuid +
        '-name">' +
        data.sensor.name +
        "</label></td>" +
        '<td align="center"><div onclick="onClickSwitch_999(\'' +
        data.sensor.uuid +
        "','" +
        data.device.uuid +
        "','" +
        data.sensor.type +
        '\');"><span id="switch_value_' +
        data.sensor.uuid +
        '">' +
        switchTextValue +
        "</span></div></td>" +
        "</tr>";
      break;
    case "GenericSensor":
      html +=
        "<tr>" +
        "<td>" +
        (i + 1) +
        "</td>" +
        '<td><img width="25px" src="../images/basic_sensors/humidity.png"/></td>' +
        '<td><label id="' +
        data.sensor.uuid +
        '-name">' +
        data.sensor.name +
        "</label></td>" +
        '<td align="center"><span class="text-muted" style="font-size:large"><em id="' +
        data.sensor.uuid +
        '">' +
        data.sensor.value +
        "</em></span></td>" +
        "</tr>";
      break;
    default:
      break;
  }

  return html;
}

function SensorHtmlUpdate_999(data) {
  switch (data.sensor.type) {
    case "Switch":
      if (1 == data.sensor.value) {
        document.getElementById("switch_value_" + data.sensor.uuid).innerHTML =
          "On";
      } else {
        document.getElementById("switch_value_" + data.sensor.uuid).innerHTML =
          "Off";
      }
      break;
    case "GenericSensor":
      document.getElementById(data.sensor.uuid).innerHTML = data.sensor.value;
      break;
    default:
      break;
  }
}

function DataArrivedHandler_999(data) {
  //   if ("get_node_info" == data.device.command) {
  //     console.log("get_node_info " + data.device.uuid);
  //     var NodeIcon = data.device.type + "-device";
  //     document.getElementById(data.device.uuid + "-node-name").innerHTML =
  //       data.payload.name;
  //     document.getElementById(data.device.uuid + "-node-description").innerHTML =
  //       data.payload.description;
  //     document.getElementById(data.device.uuid + "-node-icon").src =
  //       "modules/" + NodeIcon + "/" + NodeIcon + ".png";
  //     document.getElementById(data.device.uuid + "-modal-node-name").value =
  //       data.payload.name;
  //     document.getElementById(
  //       data.device.uuid + "-modal-node-description"
  //     ).value = data.payload.description;
  //   } else if ("get_node_status" == data.device.command) {
  //     console.log("get_node_status");
  //   } else if ("get_node_sensor_info" == data.device.command) {
  //     console.log("get_node_sensor_info");
  //     if (data.payload.sensors.length > 0) {
  //       for (i = 0; i < data.payload.sensors.length; i++) {
  //         var item = {
  //           sensor: data.payload.sensors[i],
  //           device: data.device
  //         };
  //         if (document.getElementById(item.sensor.uuid) == null) {
  //           document.getElementById(
  //             data.device.uuid + "-modal-node-sensors"
  //           ).innerHTML += SensorHtmlBuildNew_999(item);
  //         } else {
  //           SensorHtmlUpdate_999(item);
  //         }
  //       }
  //     }
  //   } else if ("set_node_sensor_info" == data.device.command) {
  //     console.log("set_node_sensor_info");
  //   } else {
  //     console.log("unknown");
  //   }

  window._MKS_DEVICES_DATA_ = data;
}

function onClickSwitch_999(uuid, node_uuid, type) {
  var SwitchValue = "0";
  if (document.getElementById("switch_value_" + uuid).innerHTML == "On") {
    SwitchValue = "0";
  } else {
    SwitchValue = "1";
  }

  MkSDeviceSendGetRequestWebface(
    {
      url: GetServerUrl(),
      key: localStorage.getItem("key"),
      uuid: node_uuid,
      cmd: "set_node_sensor_info",
      payload: {
        sensors: [
          {
            uuid: uuid,
            value: SwitchValue,
            type: type
          }
        ]
      }
    },
    function(res) {}
  );
}

function OpenInfoModalWindow_Device_999(uuid) {
  var self = this;

  MkSRemoveDeviceListener(uuid, DataArrivedHandler_999);
  MkSAddDeviceListener(uuid, DataArrivedHandler_999);

  MkSOpenDeviceModal(uuid);
  MkSDeviceSendGetRequestWebface(
    {
      url: GetServerUrl(),
      key: localStorage.getItem("key"),
      uuid: uuid,
      cmd: "get_node_sensor_info",
      payload: {}
    },
    function(res) {}
  );
}

function OnDeviceLoaded_999(uuid) {
  MkSAddDeviceListener(uuid, DataArrivedHandler_999);
  GetNodeInformation_999(uuid);
}
