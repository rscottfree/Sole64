
"use strict";


s64.learn.now = null;
s64.learn.next_text = [];

s64.learn.go = function(num) {
    if (undefined != num) {
        s64.learn.chooseLesson(num);
        return;
    }

    s64.screen.clearScreen();
    s64.screen.printLine('Choose a lesson:');
    s64.screen.printLine('1. Loading and saving a program');
    s64.screen.printLine('2. Variables');
    s64.screen.printLine('3. User Input');
    s64.screen.printLine('4. Functions');

    s64.screen.printLine('0. Cancel');
    s64.screen.printLine('');
    s64.learn.ask(s64.learn.chooseLesson, 'Type the number of a lesson and hit enter');
};

s64.learn.ask = function(callback, prompt) {
    s64.screen.printLine(prompt);
    s64.interp.getUserInput(callback);
};

s64.learn.chooseLesson = function(n) {
    if (n == 0) {
        s64.screen.printLine('');
        s64.screen.printLine('At any time, you can view the lessons by typing "learn" and hitting enter');
        return;
    }

    try {
        s64.learn.next_text = [];
        s64.screen.clearScreen();
        s64.learn['lesson' + n]();
        s64.learn.nextText();
    } catch (e) {
        s64.screen.printLine("Lesson " + n + " not found");
        s64.screen.printLine('Type "learn" and hit enter to see a list of lessons');
    }
}

// loading and saving
s64.learn.lesson1 = function() {
    s64.learn.next('');
    s64.learn.next('');
    s64.learn.next('> Welcome to lesson one: Loading and saving and running');
    s64.learn.next('> (To stop a lesson at any time, type in "stop" and hit enter)');
    s64.learn.next('> First, let\'s load the lesson');
    s64.learn.next('> Hit enter to load lesson 1 from the internet');
    s64.learn.next('load sole64@lesson1', false, true);
    s64.learn.next('');
    s64.learn.next('> Excellent. You just loaded a file with the "load" command');
    s64.learn.next('> The file is now in memory');
    s64.learn.next('> Use the "list" command to list the program that is in memory. (Hit enter)');
    s64.learn.next('> (Hint: You can also use "ls" instead of "list" if you want)');
    s64.learn.next('list', false, true);
    s64.learn.next('');
    s64.learn.next('> And that is a program!');
    s64.learn.next('> Now we are going to save it to your computer with the "save" command');
    s64.learn.next('save lesson1', false, true);
    s64.learn.next('');
    s64.learn.next('> List out all the programs you have saved with the "load" command');
    s64.learn.next('load', false, true);
    s64.learn.next('');
    s64.learn.next('> You should see one program called "lesson1" in the list');
    s64.learn.next("> Let's save the same program again with a different name");
    s64.learn.next('save another_name', false, true);
    s64.learn.next('');
    s64.learn.next("> Good. Now run the \"load\" command again to see your list of programs");
    s64.learn.next('load', false, true);
    s64.learn.next('');
    s64.learn.next("> You should now see the names of your two programs listed here");
    s64.learn.next("> Load the \"lesson1\" file with the load command");
    s64.learn.next('load lesson1', false, true);
    s64.learn.next('');
    s64.learn.next('> Make sure the program is in memory by using the "list" command');
    s64.learn.next('list', false, true);
    s64.learn.next('');
    s64.learn.next('> Now let\'s run the program we have in memory. Do that with the "run" command');
    s64.learn.next('run', false, true, /program ended/);
    s64.learn.next('');
    s64.learn.next('> Do you remember the program we saved with the name "another_name"?');
    s64.learn.next('> Let\'s delete that program from your computer with the "remove" command');
    s64.learn.next('remove another_name', false, true);
    s64.learn.next('> And that is it. You know how to load, save, run and remove programs');
    s64.learn.next('> Type "learn" and hit enter to view other lessons');
};

// variables
s64.learn.lesson2 = function() {
    s64.learn.next('');
    s64.learn.next('');
    s64.learn.next('> Lesson 2: Variables');
    s64.learn.next('> Start out by loading lesson 2');
    s64.learn.next('load sole64@lesson2', false, true);
    s64.learn.next('> Good, now onto the lesson');
    s64.learn.next('> Variables are like containers--they hold things');
    s64.learn.next('> You name each variable something specific so you can find it when you need it');
    s64.learn.next('> A variable can hold a number, a name, or a whole list of things');
    s64.learn.next('> Let\'s now look at the code for lesson 2. Use the "ls" command to view the program');
    s64.learn.next('> (remember you can use "list" or "ls" to view the code--they are the same)');
    s64.learn.next('ls', false, true);
    s64.learn.next('> Look on line 10: This program has a varaible called food');
    s64.learn.next('> Notice that you create a new variable with the "var" keyword');
    s64.learn.next('> This "food" variable holds some text: taco');
    s64.learn.next('> Once you create the varaible, it stays on the shelf for you to use');
    s64.learn.next('> You can print variables. On line 20, this program prints out the variable');
    s64.learn.next('> When you print a variable, it prints out the value of the variable, not it\'s name');
    s64.learn.next('');
    s64.learn.next('> Line 30 shows you that you can create a variable that holds a number');
    s64.learn.next('> And on line 40, you see a variable called "flavors", which holds a list of things');
    s64.learn.next('> Let\'s finish this lesson by running our "lesson2" program with the "run" command');
    s64.learn.next('run', false, false);
};

// user input
s64.learn.lesson3 = function() {
    s64.learn.next('> Lesson 3: User Input');
    s64.learn.next('> First, load the lesson with the "load" command');
    s64.learn.next('load sole64@lesson3', false, true);
    s64.learn.next('> Take a look at the code with the "ls" command and see if you can figure out what it is going to do');
    s64.learn.next('ls', false, true);
    s64.learn.next('');
    s64.learn.next('> Ready? Let\'s run it and see what happens');
    s64.learn.next('run', false, true);
    s64.learn.next('');
    s64.learn.next('List out the program again and then we will talk about what each line does');
    s64.learn.next('ls', false, true);
    s64.learn.next('> Okay, now let us step through each line and explain it');
    s64.learn.next('> Line 10 clears the screen');
    s64.learn.next('> Line 20 prints some text out');
    s64.learn.next('> Line 30 asks the user for input, and sends whatever the user enters to a function called "checkanswer"');
    s64.learn.next('> Line 40 defines a new function called "checkanswer"');
    s64.learn.next('> Functions are blocks of code that do something specific');
    s64.learn.next('> In this case, our function will check what the user gave as their answer');
    s64.learn.next('> Line 50 says that if the user said "yes" then print this text out');
    s64.learn.next('> Line 60 prints out some different text if the user said "no"');
    s64.learn.next('> Line 70 will print out different words if the user said something besides "yes" or "no"');
    s64.learn.next('> Line 80 prints some text');
    s64.learn.next('> And line 90 ends the "checkanswer" function');
    s64.learn.next('');
    s64.learn.next('> Let\'s create a new line at line 65 for a third possible answer of "maybe"');
    s64.learn.next('> Look over the next line, then hit enter to make it part of your program');
    s64.learn.next('> Then use the "run" command to run the program again and answer the question with maybe');
    s64.learn.next("65 else if (answer == 'maybe') print(\"You mean you\'re not sure??? That\'s inconceivable\")", false, true);
    s64.learn.next('> And that\'s the end of lesson 3. Be sure to keep playing around with the code');
};

// functions
s64.learn.lesson4 = function() {
    s64.learn.next('> Lesson 4: Functions');
    s64.learn.next('> Functions are the building blocks of a program');
    s64.learn.next('> A function has a name, zero or more parameters, and code');
    s64.learn.next('> Load lesson 4 from the internet to see an example of functions');
    s64.learn.next('load sole64@lesson4', false, true);
    s64.learn.next('');
    s64.learn.next('> This program shows you how to create one line or multi-line functions and how to call them');
    s64.learn.next('> Run it with the "run" command and view it with the "ls" command. Play around with it.');
};

s64.learn.stop = function() {
    s64.learn.now = null;
    s64.learn.next_text = [];
};

s64.learn.in = function(command) {
    if (s64.learn.now == null) return;

    setTimeout(function() {
        if (s64.screen.buffer.length <= 1 && s64.screen.getCurrentLine() == '') {
            s64.learn.nextText();
        }
    }, 1391);
};

s64.learn.next = function(text, newline, wait) {
    if (undefined == newline) newline = true;
    if (undefined == wait) wait = false;

    s64.learn.next_text.push({
        text: text, newline: newline,
        wait: wait
    });
};

s64.learn.nextText = function() {
    var next = s64.learn.next_text.shift();
    if (undefined == next) {
        s64.learn.now = null;
        return;
    }

    s64.learn.now = next;

    if (next.newline) s64.screen.printLine(next.text);
    else s64.screen.print(next.text);

    if (next.wait != true) s64.learn.nextText();
};