<?php

header("Access-Control-Allow-Origin: *");
$resourceList = array("session", "messages", "profiles");

$path = explode("/", $_SERVER["REQUEST_URI"]);
$resourceName = $path[1];
$resourceId = $path[2];

if(!in_array($resourceName, $resourceList)) {
  http_response_code(404);
  exit();
}

define("APP_ROOT", $_SERVER["DOCUMENT_ROOT"]);

$method = $_SERVER["REQUEST_METHOD"];
$query = $_SERVER["QUERY_STRING"];
$data = file_get_contents("php://input");

require APP_ROOT."/resource/common.php";
require APP_ROOT."/resource/".$resourceName.".php";

if ($method == "POST") {
  $response = createResource($database, $resourceId, $data);
} elseif ($method == "GET") {
  $response = readResource($database, $resourceId, $query);
} elseif ($method == "PUT") {
  $response = updateResource($database, $resourceId, $data);
} elseif ($method == "DELETE") {
  $response = deleteResource($database, $resourceId);
} else {
  http_response_code(405);
  exit();
}

http_response_code(200);
echo $response;
