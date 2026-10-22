const guardrails = require('./utils/pr-guardrails.js');

module.exports = guardrails;

if (require.main === module) {
	void guardrails.runCli();
}
