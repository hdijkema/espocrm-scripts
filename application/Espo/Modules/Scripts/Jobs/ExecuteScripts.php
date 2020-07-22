<?php
# vim: ts=4 sw=4 et:

namespace Espo\Modules\Scripts\Jobs;

class ExecuteScripts extends \Espo\Core\Jobs\Base 
{
    protected function getFormulaManager()
    {
        return $this->getContainer()->get('formulaManager');
    }

    protected function execScript($script, $em)
    {
        $script_name = $script->get('name');
        $script_formula = $script->get('formule');

        $GLOBALS['log']->info('Start executing script: '.$script_name);

        if ($script_formula) {
            $now =  date('Y-m-d H:i:s', time());
            $script_formula = preg_replace('/\s*\/\/\s*(exec)?\s*last\s*execution\s*[:].*/i', '', $script_formula);
            $script_formula = trim($script_formula);
            $script_formula = '//exec last execution: '.$now."\n".$script_formula;
            $script->set('formule', $script_formula);
            $em->saveEntity($script);
        }

        $GLOBALS['log']->info('Done  executing script: '.$script_name);
    }

	public function run()
    {
        $em = $this->getEntityManager();

        $rep = $em->getRepository('Script');
        $scripts = $rep->where([ 'type' => 'job' ])->find();

        $GLOBALS['log']->info('execute scripts: '.$scripts->count());

        $scripts->rewind();
        while($scripts->current()) {
           $script_id = $scripts->current()->id;
           $script = $em->getEntity('Script', $script_id);
           $cron = $script->get('cron');

           $cr = \Cron\CronExpression::factory($cron);
           if ($cr->isDue()) {
               $this->execScript($script, $em);
           } else {
               $name = $script->get('name');
               $GLOBALS['log']->info('not executing: '.$name);
           }

           $scripts->next();
        }
    }
}
