<?php

function createResource($database, $resourceId, $data) {

}

function readResource($database, $resourceId, $data) {
  $sql = "SELECT * FROM `profiles`";
  $database->query($sql);
  $result = $database->getRows();
  return json_encode($result, JSON_NUMERIC_CHECK);
}

function updateResource($database, $resourceId, $data) {
  $payload = json_decode($data, true);

  unset($payload["id"]);

  if(!isset($payload["friend"]) ||
  !isset($payload["name"]) ||
  !isset($payload["email"]) ||
  !isset($payload["online"]) ||
  !isset($payload["pass"]) ||
  !isset($payload["city"]) ||
  !isset($payload["dob"]) ||
  !isset($payload["profileImg"])) {
    return null;
  }

  $sql = "UPDATE `profiles` SET ";
  foreach ($payload as $key => $val) {
      if (is_string($val)) {
        $sql .= $key . " = '" . $val . "'";

      } else {
        $sql .= $key . " = " . $val;
      }

      if(end(array_keys($payload)) != $key){
          $sql .= ", ";
      }
  }
  $sql .= " WHERE id = " . $resourceId;
  $database->query($sql);
  if($database->getAffectedRows() == -1) {
    return null;
  }
  return $data;
}

function deleteResource($database, $resourceId, $data) {

}
