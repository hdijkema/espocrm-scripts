<?php
# vi: set sw=4 ts=4 et:

use \Espo\Core\Utils\System;

class AfterInstall
{
  private function info($msg)
  {
	  $GLOBALS['log']->info('Scripts Module: ' . $msg);
  }
  
  public function run($container) 
  {
      $sys = new Espo\Core\Utils\System();
      $root_dir = $sys->getRootDir();
      $custom_dir = 'custom/Espo/Custom/Resources/metadata';

      #$custom_css_cfg_file = $custom_dir . '/app/client.json';
      #$css_f = $root_dir . '/' . $custom_css_cfg_file;
      
      #$my_css_dir = 'client/modules/scripts/css';
      
      #$css_files = [ "$my_css_dir/scripts.css", "$my_css_dir/datatables.min.css" ];
      
      $this->info('Installing...');
      $this->info('EspoCRM root directory = ' . $root_dir);
      
      #$this->info('Modifying or creating ' . $css_f);
      
      #$json = file_get_contents($css_f);
      #$this->info('Json = ' . $json);
      
      #$obj = json_decode($json);
      
      #$css = $obj->cssList;
      #foreach ($css_files as $css_e) {
          #if (!in_array($css_e, $css)) {
              #array_push($css, $css_e);
              #$this->info('Added ' . $css_e . ' to entry cssList');
          #} else {
              #$this->info('Already in cssList: ' . $css_e);
          #}
      #}
      #$obj->cssList = $css;
      
      #$json = json_encode($obj, JSON_PRETTY_PRINT);
      
      #file_put_contents($css_f, $json);

      # Because the Script type may have been used in other Entities, we need to make
      # sure, these entities will still be available. As any type defaults to varchar(255)
      # and the script type is of type text, we'll create a custom field type 'Script' that
      # is of type 'text'. 
      # AND we need to reverse this if we re-install the scripts module!!

      $this->info('Checking if we need to correct Custom script type...');

      $script_field_d = $root_dir . '/' . $custom_dir . '/fields';
      $script_field_f = $script_field_d . '/script.json';

      if (!is_dir($script_field_d)) {
          mkdir($script_field_d, 0755, true);
      }

      if (file_exists($script_field_f)) {
          $custom_script_field = json_decode(file_get_contents($script_field_f));
      } else {
          $custom_script_field = json_decode('{ "fieldDefs": { "type": "text" }}');
      }

      $this->info('Removing "type" field from fieldDefs');
      if (property_exists($custom_script_field, 'fieldDefs')) {
         $obj = $custom_script_field->fieldDefs;
         if (property_exists($obj, 'type')) {
             unset($obj->type);
         }
      }
      $this->info('json = '.json_encode($custom_script_field));

      $this->info("Putting field json in '$script_field_f'");

      file_put_contents($script_field_f, json_encode($custom_script_field, JSON_PRETTY_PRINT));
      
      $this->info('done.');
  }
}
?>
