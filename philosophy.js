const problems = [
    {
        question: "There is a trolley barreling down the tracks toward five people. You can pull a lever to divert it to another track, but doing so will kill one person. What do you do?",
        topTarget: {
            src: "philosophy-assets/oneguy.svg",
            alt: "One person"
        },
        bottomTarget: {
            src: "philosophy-assets/fiveguys.svg",
            alt: "Five people"
        }
    },
    {
        question: "There is a trolley barreling down the tracks toward five people. You can pull a lever to divert it to another track, but doing so will kill four people. What do you do?",
        topTarget: {
            src: "philosophy-assets/fourguys.svg",
            alt: "Four people"
        },
        bottomTarget: {
            src: "philosophy-assets/fiveguys.svg",
            alt: "Five people"
        }
    },
    {
        question: "There is a trolley barreling down the tracks toward five people. You can pull a lever to divert it to another track, but doing so will kill a woman pregnant with triplets. What do you do?",
        topTarget: {
            src: "philosophy-assets/pregnant.png",
            alt: "Pregnant Woman"
        },
        bottomTarget: {
            src: "philosophy-assets/fiveguys.svg",
            alt: "Five people"
        }
    },
    {
        question: "There is a trolley barreling down the tracks toward five people. You can pull a lever to divert it to another track, but doing so will kill a young doctor who will save 100 people in his life. What do you do?",
        topTarget: {
            src: "philosophy-assets/doctor.png",
            alt: "A Doctor"
        },
        bottomTarget: {
            src: "philosophy-assets/fiveguys.svg",
            alt: "Five people"
        }
    },
    {
        question: "There is a trolley barreling down the tracks toward a cute puppy. You can pull a lever to divert it to another track, but doing so will kill a human who hates puppies and kicks them regularly. What do you do?",
        topTarget: {
            src: "philosophy-assets/angryguy.svg",
            alt: "An Angry Guy"
        },
        bottomTarget: {
            src: "philosophy-assets/puppy.png",
            alt: "A Cute Puppy"
        }
    },
    {
        question: "There is a trolley barreling down the tracks toward five people. You can pull a lever to divert it to another track, but doing so will kill you from the future, who traveled in time to tell you not to pull the lever. What do you do?",
        topTarget: {
            src: "philosophy-assets/yourself.png",
            alt: "You From the Future"
        },
        bottomTarget: {
            src: "philosophy-assets/fiveguys.svg",
            alt: "Five people"
        }
    },
    {
        question: "There is a trolley barreling down the tracks toward five people. You can pull a lever to divert it to another track, but doing so will wipe from existence every Shrek movie. What do you do?",
        topTarget: {
            src: "philosophy-assets/shrek.png",
            alt: "Shrek"
        },
        bottomTarget: {
            src: "philosophy-assets/fiveguys.svg",
            alt: "Five people"
        }
    },
    {
        question: "There is a trolley barreling down the tracks toward 1 person who knows what really happens in Area 51. You can pull a lever to divert it to another track, but doing so will kill 1 normal person instead. What do you do?",
        topTarget: {
            src: "philosophy-assets/oneguy.svg",
            alt: "One Guy"
        },
        bottomTarget: {
            src: "philosophy-assets/thinker.png",
            alt: "A Man Thinking"
        }
    },
    {
        question: "There is a trolley barreling down the tracks toward five people. You can pull a lever to divert it to another track, but doing so will kill Erwin Schrodinger, who is in a superposition of being both alive and dead simultaneously. What do you do?",
        topTarget: {
            src: "philosophy-assets/schrodinger.png",
            alt: "Erwin Schrodinger"
        },
        bottomTarget: {
            src: "philosophy-assets/fiveguys.svg",
            alt: "Five people"
        }
    },
    {
        question: "There is a trolley barreling down the tracks toward five people. You can pull a lever to divert it to another track, but doing so will kill a philosopher who is on the brink of solving the trolley problem forever. What do you do?",
        topTarget: {
            src: "philosophy-assets/trolleythinker.png",
            alt: "Man Thinking About Trolleys"
        },
        bottomTarget: {
            src: "philosophy-assets/fiveguys.svg",
            alt: "Five people"
        }
    },
    {
        question: "There is a trolley barreling down the tracks toward everything you have ever lost. You can pull a lever to divert it to another track, but doing so will destroy everything you will ever lose. What do you do?",
        topTarget: {
            src: "philosophy-assets/heapnew.png",
            alt: "A pile of new things"
        },
        bottomTarget: {
            src: "philosophy-assets/heapold.png",
            alt: "A pile of old things"
        }
    },
    {
        question: "There is a trolley barreling down the tracks toward an engineer developing the perfect printer that never breaks. You can pull a lever to divert it to another track, but doing so will kill a scientist who has foudn the cure for the common cold. What do you do?",
        topTarget: {
            src: "philosophy-assets/scientist.png",
            alt: "A Scientist"
        },
        bottomTarget: {
            src: "philosophy-assets/engineer.png",
            alt: "An Engineer with a Printer"
        }
    },
    {
        question: "There is a trolley barreling down the tracks towards that feeling you get when you remember an embarrassing moment from 10 years ago. You can pull a lever to divert it to another track, but doing so will kill the monster who eats all your lost socks. What do you do?",
        topTarget: {
            src: "philosophy-assets/sockman.png",
            alt: "A sock monster"
        },
        bottomTarget: {
            src: "philosophy-assets/embarrassing.png",
            alt: "Embarrassment"
        }
    }
];

let currentProblem = 0;

function displayProblem(index) {
    const problem = problems[index];
    
    // Update question
    document.getElementById('question').textContent = problem.question;
    
    // Update images
    const topTarget = document.getElementById('top-target');
    const bottomTarget = document.getElementById('bottom-target');
    
    // Clear existing images
    topTarget.innerHTML = '';
    bottomTarget.innerHTML = '';
    
    // Create and append new images
    const topImg = document.createElement('img');
    topImg.src = problem.topTarget.src;
    topImg.alt = problem.topTarget.alt;
    topTarget.appendChild(topImg);
    
    const bottomImg = document.createElement('img');
    bottomImg.src = problem.bottomTarget.src;
    bottomImg.alt = problem.bottomTarget.alt;
    bottomTarget.appendChild(bottomImg);
}

function showSplatEffect(isLeverPulled) {
    // Create splat image
    const splatImg = document.createElement('img');
    splatImg.src = "philosophy-assets/splat.svg";
    splatImg.alt = "Splat";
    
    // Replace appropriate target with splat
    const targetElement = isLeverPulled ? 
        document.getElementById('top-target') : 
        document.getElementById('bottom-target');
    
    targetElement.innerHTML = '';
    targetElement.appendChild(splatImg);
}

function handleChoice(event) {
    // Disable buttons to prevent multiple clicks
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => button.disabled = true);
    
    // Determine if lever was pulled
    const isLeverPulled = event.target.id === 'pull-lever';
    
    // Show splat effect
    showSplatEffect(isLeverPulled);
    
    // Wait 3 seconds before moving to next problem
    setTimeout(() => {
        currentProblem++;
        if (currentProblem < problems.length) {
            displayProblem(currentProblem);
            // Re-enable buttons
            buttons.forEach(button => button.disabled = false);
        } else {
            // Handle end of problems
            document.querySelector('.container').innerHTML = '<h1>Thank you for participating!</h1>';
        }
    }, 3000);
}

// Event listeners
document.getElementById('do-nothing').addEventListener('click', handleChoice);
document.getElementById('pull-lever').addEventListener('click', handleChoice);

// Initialize first problem
displayProblem(0);