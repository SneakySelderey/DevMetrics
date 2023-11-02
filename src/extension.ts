// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Console } from 'console';
import { globalAgent } from 'http';
import * as vscode from 'vscode';

interface IDictionary {
    [key: string]: number;
}

interface IDictionaryTextDoc {
    [key: string]: vscode.TextDocument;
}

interface IDictionaryArray {
    [key: string]: any[];
}

class Metrics
/**
 * Class that represents all kind of tracked metrics
 */
{
	constructor(docsPrevState = {}, docsObj = {}, 
		additionsCount = 0, deletionsCount = 0, additionsByDocs = [['N/A', 0]], 
		deletionsByDocs = [['N/A', 0]], secondsCount = 0, minuteCount = 0, hourCount = 0,
		currentMonth = (new Date().getMonth() + 1), goalAdditionsMonth = -1, goalTimeMonth = -1,
		goalAdditionsReached = false, goalTimeReached = false)
	{
		this.docsPrevState = docsPrevState;
		this.docsObj = docsObj;
		this.additionsCount = additionsCount;
		this.deletionsCount = deletionsCount;
		this.additionsByDocs = additionsByDocs;
		this.deletionsByDocs = deletionsByDocs;
		this.secondsCount = secondsCount;
		this.minuteCount = minuteCount;
		this.hourCount = hourCount;
		this.currentMonth = currentMonth;
		this.goalAdditionsMonth = goalAdditionsMonth;
		this.goalTimeMonth = goalTimeMonth;
		this.goalAdditionsReached = goalAdditionsReached;
		this.goalTimeReached = goalTimeReached;
	}

	docsPrevState: IDictionary; // track initial state of docs
	docsObj: IDictionaryTextDoc; // track current state of docs
	additionsCount; // number of overall additions
	deletionsCount; // number of overall deletions
	additionsByDocs; // number of additions for each active doc
	deletionsByDocs; // number of deletions for each active doc
	secondsCount; // number of seconds for time tracker
	minuteCount; // number of minutes for time tracker
	hourCount; // number of hours for time tracker
	currentMonth; // current month
	goalAdditionsMonth; // additions goal for current month
	goalTimeMonth; // time goal for current month
	goalAdditionsReached; // flag, true if additions goal was reached
	goalTimeReached; // flag, true if time goal was reached
}

function updateActiveDocument(metrics: Metrics)
/**
 * Updates list of active docs by checking if any doc was already opened on startup and, if so, adding it to the list.
 * 
 * @param metrics - Metrics class
 * 
 * @returns Metrics class
 */
{
	if (vscode.window.activeTextEditor?.document.fileName !== undefined 
		&& vscode.window.activeTextEditor?.document.lineCount !== undefined)
		{
			if (Object.keys(metrics.docsPrevState).includes(vscode.window.activeTextEditor?.document.fileName) === false) // if the file was not opened by user before
			{
				metrics.docsPrevState[vscode.window.activeTextEditor?.document.fileName as string] = vscode.window.activeTextEditor?.document.lineCount as number; // save initial amount of lines for the file
			}
			metrics.docsObj[vscode.window.activeTextEditor?.document.fileName as string] = vscode.window.activeTextEditor?.document; // save current amount of lines for the file
		}
	return metrics;
}

function updateMetrics(metrics: Metrics, config: vscode.WorkspaceConfiguration)
/**
 * Updates metrics class for current session.
 * 
 * @param metrics - Metrics class to update
 * 
 * @returns Metrics class
 */
{
	if ((new Date().getMonth() + 1) !== metrics.currentMonth) // if current month has changed
	{
		metrics = new Metrics(); // create new Metric object
		metrics = updateActiveDocument(metrics); // update and write it to storage
		return metrics;
	}
	metrics.additionsCount = 0, metrics.deletionsCount = 0;
	metrics.additionsByDocs = [['N/A', 0]], metrics.deletionsByDocs = [['N/A', 0]];
	let delta = 0; // counter for delta between original doc and modified doc
	for (let key in metrics.docsPrevState)
	{
		delta = metrics.docsObj[key].lineCount - metrics.docsPrevState[key];
		if (delta > 0) // if the delta is positive, push the element to additions
		{
			metrics.additionsCount += delta;
			metrics.additionsByDocs.push([key, delta]);
		}
		else if (delta < 0) // if the delta is negative, push the element to deletions
		{
			metrics.deletionsCount -= delta;
			metrics.deletionsByDocs.push([key, -delta]);
		}
	}
	metrics.additionsByDocs.sort((a, b) => a[1] < b[1] ? -1 : 1); // get top docs by additions
	metrics.deletionsByDocs.sort((a, b) => a[1] > b[1] ? -1 : 1); // get top docs by deletions

	return metrics;
}



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "devmetrics" is now active!');

	let metrics: Metrics;

	if (context.globalState.keys().includes("metrics") === false) // check if metrics were already saved to global storage
	{
		metrics = new Metrics(); // metrics class
	}
	else
	{
		metrics = context.globalState.get("metrics") as Metrics; // if metrics are in global storage, read them
	}

	let config = vscode.workspace.getConfiguration('devmetrics'); // get config
	metrics.goalAdditionsMonth = config.get('additionsGoal') as number; // set configured additions goal
	metrics.goalTimeMonth = config.get('timeGoal') as number; // set configured time goal

	const updateTimeTracker = () =>
	/**
	 * Arrow function to update time tracker timer.
	 */
	{
		metrics.secondsCount++;
		if (metrics.secondsCount === 60)
		{
			metrics.minuteCount++;
			metrics.secondsCount = 0;
		}
		if (metrics.minuteCount === 60)
		{
			metrics.hourCount++;
			metrics.minuteCount = 0;
		}
	};

	setInterval(updateTimeTracker, 1000); // update time tracker every second

	const checkGoals = () =>
	/**
	 * Arrow function to check if goals were reached.
	 */
	{
		if (metrics.goalAdditionsMonth !== -1 && metrics.additionsCount >= metrics.goalAdditionsMonth
			&& metrics.goalAdditionsReached === false) // if goal is active, incomplete and was reached
			{
				vscode.window.showInformationMessage("You've reached your month goal for additions! Congrats! 🎉");
				metrics.goalAdditionsReached = true; // set this goal as complete
			}
		if (metrics.goalTimeMonth !== -1 && metrics.hourCount >= metrics.goalTimeMonth
			&& metrics.goalTimeReached === false) // if goal is active, incomplete and was reached
			{
				vscode.window.showInformationMessage("You've reached your month goal for time spent in IDE! Congrats! 🎉");
				metrics.goalTimeReached = true; // set this goal as complete
			}
	};

	setInterval(checkGoals, 1000); // check goals every second

	const updateGoals = () =>
	/**
	 * Arrow function to update goals values.
	 */
	{
		config = vscode.workspace.getConfiguration('devmetrics'); // get current config
		if (metrics.goalAdditionsMonth !== config.get('additionsGoal') as number) // if add goal has changed
	{
		metrics.goalAdditionsMonth = config.get('additionsGoal') as number; // update goal
		metrics.goalAdditionsReached = false; // set this goal as incomplete
	}
		if (metrics.goalTimeMonth !== config.get('timeGoal') as number) // if time goal has changed
		{
			metrics.goalTimeMonth = config.get('timeGoal') as number; // update goal
			metrics.goalTimeReached = false; // set this goal as incomplete
	}
	};

	setInterval(updateGoals, 1000); // update goals every second

	const updateMetricsObj = () =>
	/**
	 * Arrow function to update metrics object
	 */
	{
		metrics = updateMetrics(metrics);
	};

	setInterval(updateMetricsObj, 1000) // update metrics every second

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let showDataCommand = vscode.commands.registerCommand('devmetrics.showData', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		metrics = updateMetrics(metrics, vscode.workspace.getConfiguration('devmetrics'));
		context.globalState.update("metrics", metrics); // write updated metrics to storage

		const panel = vscode.window.createWebviewPanel(
			'devMetrics', // Identifies the type of the webview.
			'DevMetrics', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{
			} // Webview options.
		  );
		//create webview using metrics
		  panel.webview.html = getWebviewContent(metrics);
		// update webview every second
		  const updateWebview = () => {
			panel.webview.html = getWebviewContent(metrics);
		  };
	
		  // Set initial content
		  updateWebview();
	
		  // And schedule updates to the content every second
		  const webViewUpdateInterval = setInterval(updateWebview, 1000);

		  panel.onDidDispose(
			() => {
			  // When the panel is closed, cancel any future updates to the webview content
			  clearInterval(webViewUpdateInterval);
			},
			null, context.subscriptions);
	});

	let resetDataCommand = vscode.commands.registerCommand('devmetrics.resetData', () =>
	/**
	 * This arrow function resets stored metrics to their default values.
	 */
	{
		context.globalState.update("metrics", undefined); // delete metrics from storage
		metrics = new Metrics(); // create new Metric object
		metrics = updateActiveDocument(metrics); // update and write it to storage
	});

	metrics = updateActiveDocument(metrics);

	// this block of code checks all documents opened by users
	vscode.window.onDidChangeActiveTextEditor(function(event) {
		if (event?.document.fileName !== undefined 
			&& vscode.window.activeTextEditor?.document.lineCount !== undefined)
		{
			if (Object.keys(metrics.docsPrevState).includes(event?.document.fileName) === false) // if the file was not opened by user before
			{
				metrics.docsPrevState[event?.document.fileName] = event.document.lineCount as number; // save initial amount of lines for each files
			}
			metrics.docsObj[vscode.window.activeTextEditor?.document.fileName as string] = event.document; // save current state of file
		}
	});

	context.subscriptions.push(showDataCommand);
	context.subscriptions.push(resetDataCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(metrics: Metrics)
/**
   * Returns HTML strucure for WebView to display.
   * 
   * @param x - (Metrics) Metric to display.
   * @returns - HTML structure.
*/
{
	if (metrics.goalAdditionsMonth !== -1 && metrics.goalTimeMonth !== -1)
	{
		return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>DevMetrics data</title>
			</head>
			<body>
				<h2>Coding statistics</h2>
				<ul>
					<li>
						<h3>Additions/deletions:</h3>
						<p style="color: green; font-size:16px;">Lines of code added this month: ${metrics.additionsCount}</p>
						<p style="color: red; font-size:16px;">Lines of code deleted this month: ${metrics.deletionsCount}</p>
					</li>
					<li>
						<h3>Top files by additions/deletions</h3>
						<p style="color: green; font-size:16px;">Top file by additions this month: ${metrics.additionsByDocs[metrics.additionsByDocs.length - 1][0]} - ${metrics.additionsByDocs[metrics.additionsByDocs.length - 1][1]} additions</p>
						<p style="color: red; font-size:16px;">Top file by deletions this month: ${metrics.deletionsByDocs[0][0]} - ${metrics.deletionsByDocs[0][1]} deletions</p>
					</li>
				</ul>
				<h2>Time statistics<h2>
				<ul>
					<li>
					<p style="font-size:16px;">Time spent in IDE this month: ${metrics.hourCount}h ${metrics.minuteCount}min ${metrics.secondsCount}sec</p>
					</li>
				</ul>
				<h2>Global goals progress</h2>
				<p font-size:16px;">Additions: ${metrics.additionsCount}/${metrics.goalAdditionsMonth}</p>
				<p font-size:16px;">Time: ${metrics.hourCount}/${metrics.goalTimeMonth}</p>
			</body>
		</html>`;
	}
	else if (metrics.goalAdditionsMonth === -1 && metrics.goalTimeMonth !== -1)
	{
		return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>DevMetrics data</title>
			</head>
			<body>
				<h2>Coding statistics</h2>
				<ul>
					<li>
						<h3>Additions/deletions:</h3>
						<p style="color: green; font-size:16px;">Lines of code added this month: ${metrics.additionsCount}</p>
						<p style="color: red; font-size:16px;">Lines of code deleted this month: ${metrics.deletionsCount}</p>
					</li>
					<li>
						<h3>Top files by additions/deletions</h3>
						<p style="color: green; font-size:16px;">Top file by additions this month: ${metrics.additionsByDocs[metrics.additionsByDocs.length - 1][0]} - ${metrics.additionsByDocs[metrics.additionsByDocs.length - 1][1]} additions</p>
						<p style="color: red; font-size:16px;">Top file by deletions this month: ${metrics.deletionsByDocs[0][0]} - ${metrics.deletionsByDocs[0][1]} deletions</p>
					</li>
				</ul>
				<h2>Time statistics<h2>
				<ul>
					<li>
					<p style="font-size:16px;">Time spent in IDE this month: ${metrics.hourCount}h ${metrics.minuteCount}min ${metrics.secondsCount}sec</p>
					</li>
				</ul>
				<h2>Global goals progress</h2>
				<p font-size:16px;">Time: ${metrics.hourCount}/${metrics.goalTimeMonth}</p>
			</body>
		</html>`;
	}
	else if (metrics.goalAdditionsMonth !== -1 && metrics.goalTimeMonth === -1)
	{
		return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>DevMetrics data</title>
			</head>
			<body>
				<h2>Coding statistics</h2>
				<ul>
					<li>
						<h3>Additions/deletions:</h3>
						<p style="color: green; font-size:16px;">Lines of code added this month: ${metrics.additionsCount}</p>
						<p style="color: red; font-size:16px;">Lines of code deleted this month: ${metrics.deletionsCount}</p>
					</li>
					<li>
						<h3>Top files by additions/deletions</h3>
						<p style="color: green; font-size:16px;">Top file by additions this month: ${metrics.additionsByDocs[metrics.additionsByDocs.length - 1][0]} - ${metrics.additionsByDocs[metrics.additionsByDocs.length - 1][1]} additions</p>
						<p style="color: red; font-size:16px;">Top file by deletions this month: ${metrics.deletionsByDocs[0][0]} - ${metrics.deletionsByDocs[0][1]} deletions</p>
					</li>
				</ul>
				<h2>Time statistics<h2>
				<ul>
					<li>
					<p style="font-size:16px;">Time spent in IDE this month: ${metrics.hourCount}h ${metrics.minuteCount}min ${metrics.secondsCount}sec</p>
					</li>
				</ul>
				<h2>Global goals progress</h2>
				<p font-size:16px;">Additions: ${metrics.additionsCount}/${metrics.goalAdditionsMonth}</p>
			</body>
		</html>`;
	}
	else if (metrics.goalAdditionsMonth === -1 && metrics.goalTimeMonth === -1)
	{
		return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>DevMetrics data</title>
			</head>
			<body>
				<h2>Coding statistics</h2>
				<ul>
					<li>
						<h3>Additions/deletions:</h3>
						<p style="color: green; font-size:16px;">Lines of code added this month: ${metrics.additionsCount}</p>
						<p style="color: red; font-size:16px;">Lines of code deleted this month: ${metrics.deletionsCount}</p>
					</li>
					<li>
						<h3>Top files by additions/deletions</h3>
						<p style="color: green; font-size:16px;">Top file by additions this month: ${metrics.additionsByDocs[metrics.additionsByDocs.length - 1][0]} - ${metrics.additionsByDocs[metrics.additionsByDocs.length - 1][1]} additions</p>
						<p style="color: red; font-size:16px;">Top file by deletions this month: ${metrics.deletionsByDocs[0][0]} - ${metrics.deletionsByDocs[0][1]} deletions</p>
					</li>
				</ul>
				<h2>Time statistics<h2>
				<ul>
					<li>
					<p style="font-size:16px;">Time spent in IDE this month: ${metrics.hourCount}h ${metrics.minuteCount}min ${metrics.secondsCount}sec</p>
					</li>
				</ul>
			</body>
		</html>`;
	}
	return '';
  }
