<?php

header("Access-Control-Allow-Origin: *");
header("Content-type: application/json");

$resourceList = array("session", "messages", "profiles");

$path = explode("/", $_SERVER["SCRIPT_NAME"]);
$resourceName = isset($path[1]) ? $path[1] : null;
$resourceId = isset($path[2]) ? $path[2] : null;

if(!$resourceName) {
  http_response_code(400);
  exit();
}

if(!in_array($resourceName, $resourceList)) {
  http_response_code(404);
  exit();
}

define("APP_ROOT", $_SERVER["DOCUMENT_ROOT"]);

$method = $_SERVER["REQUEST_METHOD"];
$data = file_get_contents("php://input");

require APP_ROOT."/resource/common.php";
require APP_ROOT."/resource/".$resourceName.".php";

if ($method == "POST") {
  $response = createResource($database, $resourceId, $data);
  http_response_code(is_null($response) ? 400 : 201);
} elseif ($method == "GET") {
  $response = readResource($database, $resourceId, $_GET);
  http_response_code(is_null($response) ? 400 : 200);
} elseif ($method == "PUT") {
  $response = updateResource($database, $resourceId, $data);
  http_response_code(is_null($response) ? 400 : 201);
} elseif ($method == "DELETE") {
  $response = deleteResource($database, $resourceId, $_GET);
  http_response_code(200);
} else {
  http_response_code(405);
  exit();
}
$database->close();
echo $response;
