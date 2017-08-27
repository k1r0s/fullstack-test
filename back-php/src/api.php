<?php

$method = $_SERVER["REQUEST_METHOD"];
$uri = $_SERVER["REQUEST_URI"];
$query = $_SERVER["QUERY_STRING"];
$data = file_get_contents('php://input');
