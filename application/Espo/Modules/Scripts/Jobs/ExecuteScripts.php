<?php
# vim: ts=4 sw=4 et:

namespace Espo\Modules\Scripts\Jobs;

use Espo\Core\{
   Job\JobDataLess,
   ORM\EntityManager,
   Utils\Log,
};

use Throwable;

class ExecuteScripts implements JobDataLess
{
	private $entityManager;
	private $log;
	
	public function __construct(EntityManager $entityManager, Log $log)
	{
		$this->entityManager = $entityManager;
		$this->log = $log;
	}
	
	protected function getEntityManager()
	{
		return $this->entityManager;
	}
	
	protected function logInfo($msg)
	{
		$this->log->warning($msg);
	}
	
	protected function logError($msg)
	{
		$this->log->error($msg);
	}
	
    protected function execScript($script, $em)
    {
        $script_name = $script->get('name');
        $script_formula = $script->get('formule');
		
        if ($script_formula) {
			$this->logInfo('  Starting execution of script: ' . $script_name);
            $now =  date('Y-m-d H:i:s', time());
            $script_formula = preg_replace('/\s*\/\/\s*(exec)?\s*last\s*execution\s*[:].*/i', '', $script_formula);
            $script_formula = trim($script_formula);
            $script_formula = '//exec last execution: '.$now."\n".$script_formula;
            $script->set('formule', $script_formula);
            $em->saveEntity($script);
			$this->logInfo('   Done executing script: ' . $script_name);
        } else {
			$this->logInfo('   Script does not seem to have a formula');
		}
    }

	public function run() : void
    {
		$this->logInfo('Running Script Job');
		
		
        $em = $this->getEntityManager();

        $rep = $em->getRepository('Script');
        $scripts = $rep->where([ 'type' => 'job' ])->find();
		$script_count = $scripts->count();
		
		$this->logInfo('Number of scripts to evaluate: ' . $script_count);
		
		if ($script_count > 0) {
			$scripts->rewind();
			$script_idx = 0;
			while($script_idx < $script_count) {
				$script_id = $scripts->current()->id;
				$script = $em->getEntity('Script', $script_id);
				$script_name = $script->get('name');
				$cron = $script->get('cron');
		   
				$msg = 'Evaluating script[' . $script_idx . ']: ' . $script_name . ', cron = ' . $cron;

				$cr = \Cron\CronExpression::factory($cron);
				if ($cr->isDue()) {
					$this->logInfo($msg . ' -  Executing script, script is due for execution');
					$this->execScript($script, $em);
				} else {
					$this->logInfo($msg . ' -  Script is not due for execution');
				}
				
				$scripts->next();
				$script_idx += 1;
			}
        }
    }
}
