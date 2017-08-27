<?php

require APP_ROOT."/mysql_credentials.php";

class MySQLAdapter {

  private $_link, $_result, $_num_rows, $_lastError, $_lastQuery;

  function __construct() {
      $this->connect();
      mysql_query("SET NAMES 'utf8'");
  }

  function __destruct() {
      $this->close();
  }

  public function getAffectedRows() {
    return $this->_num_rows;
  }

  private function connect() {
      $this->_link = mysql_connect(DB_SERVER, DB_USER, DB_PASSWORD) or die(mysql_error());
      mysql_select_db(DB_DATABASE, $this->_link) or die(mysql_error());
  }

  public function getLastError() {
    return mysql_error();
  }

  public function query($sql_string) {
    $this->_result = mysql_query($sql_string, $this->_link);
    $this->_num_rows = mysql_affected_rows();
  }

  public function getRows() {
    $data = array();
    while ($row = $this->getRow()) {
        $data[] = $row;
    }
    return $data;
  }

  public function getRow() {
    return mysql_fetch_assoc($this->_result);
  }

  public function close() {
    mysql_close();
  }
}
