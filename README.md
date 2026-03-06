Pro MCQ Test Platform
Overview

Pro MCQ Test Platform is a React + TypeScript based web application designed to help users practice and improve their aptitude skills through a large collection of multiple-choice questions. The platform provides 1800+ MCQs covering important aptitude areas such as Verbal Ability, Numerical Ability, and Logical Reasoning.

The goal of this project is to create a simple and efficient learning platform where users can practice questions, test their understanding, and strengthen their problem-solving abilities commonly required for competitive exams and technical placements.

Features

Practice 1800+ Multiple Choice Questions

Covers Verbal Ability, Numerical Ability, and Logical Reasoning

Clean and responsive React-based user interface

Structured question dataset using JSON

AI support using Gemini API for intelligent interactions

Fast performance powered by Vite

Tech Stack

React.js

TypeScript

Vite

HTML & CSS

JSON (for MCQ dataset)

Google Gemini API

Project Structure
src
 ├── data
 │    └── questions.json        # MCQ dataset
 ├── services
 │    └── geminiService.ts      # Gemini AI integration
 ├── App.tsx                    # Main application component
 ├── main.tsx                   # Application entry point
 ├── types.ts                   # TypeScript types
 └── index.css                  # Styling
Installation

Clone the repository:

git clone https://github.com/Manish-Lulla/pro-mcq-test-platform.git

Move into the project folder:

cd pro-mcq-test-platform

Install dependencies:

npm install

Run the development server:

npm run dev
Future Improvements

User login and authentication

Timed mock tests

Score tracking and analytics

Difficulty level filtering

Question explanations

Leaderboards

Purpose of the Project

This project demonstrates the development of a modern React + TypeScript web application designed for educational purposes. It showcases frontend development, structured data handling, and integration with external AI services.