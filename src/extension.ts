// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Console } from 'console';
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
		deletionsByDocs = [['N/A', 0]], secondsCount = 0, minuteCount = 0, hourCount = 0)
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
}

function updateActiveDocument(metrics: Metrics)
{
	// this block of code tracks the initial document if it was already opened on startup
	if (vscode.window.activeTextEditor?.document.fileName !== undefined 
		&& vscode.window.activeTextEditor?.document.lineCount !== undefined)
		{
			if (Object.keys(metrics.docsPrevState).includes(vscode.window.activeTextEditor?.document.fileName) === false)
			{
				metrics.docsPrevState[vscode.window.activeTextEditor?.document.fileName as string] = vscode.window.activeTextEditor?.document.lineCount as number;
			}
			metrics.docsObj[vscode.window.activeTextEditor?.document.fileName as string] = vscode.window.activeTextEditor?.document;
		}
	return metrics;
}

/**
 * Updates metrics class for current session.
 * 
 * @argument metrics - Metrics class to update
 * 
 * @returns Metrics
 */
function updateMetrics(metrics: Metrics)
{
	metrics.additionsCount = 0, metrics.deletionsCount = 0;
	metrics.additionsByDocs = [['N/A', 0]], metrics.deletionsByDocs = [['N/A', 0]];
	let delta = 0; // counter for delta between original doc and modified doc
	for (let key in metrics.docsPrevState)
	{
		delta = metrics.docsObj[key].lineCount - metrics.docsPrevState[key];
		if (key === "e:\\Coding\\ITMO\\Labs\\Software Engineering Tools\\Software Engineering Tools lab 3\\test\\test.py")
		{
			console.log(metrics.docsPrevState[key], metrics.docsObj[key].lineCount);
		}
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
	
	// this block of code updates the timer every second
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

	return metrics;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "devmetrics" is now active!');

	let metrics: Metrics;

	if (context.globalState.keys().includes("metrics") === false)
	{
		metrics = new Metrics(); // metrics class
	}
	else
	{
		metrics = context.globalState.get("metrics") as Metrics;
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let showDataCommand = vscode.commands.registerCommand('devmetrics.showData', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		metrics = updateMetrics(metrics);
		context.globalState.update("metrics", metrics);

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
			metrics = updateMetrics(metrics);
			context.globalState.update("metrics", metrics);
			panel.webview.html = getWebviewContent(metrics);
		  };
	
		  // Set initial content
		  updateWebview();
	
		  // And schedule updates to the content every second
		  setInterval(updateWebview, 1000);
	});

	let resetDataCommand = vscode.commands.registerCommand('devmetrics.resetData', () => 
	{
		context.globalState.update("metrics", undefined);
		metrics = new Metrics();
		metrics = updateActiveDocument(metrics);
	});

	metrics = updateActiveDocument(metrics);

	// this block of code thacks all documents opened by users
	vscode.window.onDidChangeActiveTextEditor(function(event) {
		if (event?.document.fileName !== undefined 
			&& vscode.window.activeTextEditor?.document.lineCount !== undefined)
		{
			if (Object.keys(metrics.docsPrevState).includes(event?.document.fileName) === false)
			{
				metrics.docsPrevState[event?.document.fileName] = event.document.lineCount as number;
			}
			metrics.docsObj[vscode.window.activeTextEditor?.document.fileName as string] = event.document;
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
					<p style="color: green; font-size:16px;">Lines of code added during current session: ${metrics.additionsCount}</p>
					<p style="color: red; font-size:16px;">Lines of code deleted during current session: ${metrics.deletionsCount}</p>
				</li>
				<li>
					<h3>Top files by additions/deletions</h3>
					<p style="color: green; font-size:16px;">Top file by additions: ${metrics.additionsByDocs[metrics.additionsByDocs.length - 1][0]} - ${metrics.additionsByDocs[metrics.additionsByDocs.length - 1][1]} additions</p>
					<p style="color: red; font-size:16px;">Top file by deletions: ${metrics.deletionsByDocs[0][0]} - ${metrics.deletionsByDocs[0][1]} deletions</p>
				</li>
			</ul>
			<h2>Time statistics<h2>
			<ul>
				<li>
				<p style="font-size:16px;">Time spent in IDE: ${metrics.hourCount}h ${metrics.minuteCount}min ${metrics.secondsCount}sec</p>
				</li>
			</ul>
		</body>
	</html>`;
  }
