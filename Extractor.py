import csv
import json


result = {}
with open('./Data/oil-production-by-region.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        code = row["Code"]        
        if code != "":
            year = row["Year"]
            country_code = row["Code"]
            production = float(row["Oil production - TWh"])
            country = row["Entity"]

            if year not in result:
                result[year] = {}

            result[year][country_code] = {
                "country": country,
                "production": production
            }

with open('./Data/oil-consumption-by-country.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        code = row["Code"]        
        if code != "":
            year = row["Year"]
            country_code = row["Code"]
            consumption = float(row["Oil consumption - TWh"])

            if year not in result:
                result[year] = {}
            if country_code not in result[year]:
                result[year][country_code] = {"country": row["Entity"]}

            result[year][country_code]["consumption"] = consumption

with open('./Data/oil-proved-reserves.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        code = row["Code"]        
        if code != "":
            year = row["Year"]
            country_code = row["Code"]
            reserves = float(row["Oil proved reserves - BBL"])
            country = row["Entity"]

            if year not in result:
                result[year] = {}
            if country_code not in result[year]:
                result[year][country_code] = {"country": row["Entity"]}

            result[year][country_code]["reserves"] = reserves


with open('./Data/energy-consumption-by-source-and-country.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        code = row["Code"]        
        if code != "":
            year = row["Year"]
            country_code = row["Code"]
            country = row["Entity"]
            others = float(row["others"] or 0)
            biofuels = float(row["biofuels"] or 0)
            solar = float(row["solar"] or 0)
            wind = float(row["wind"] or 0)
            hydro = float(row["hydro"] or 0)
            nuclear = float(row["nuclear"] or 0)
            gas = float(row["gas"] or 0)
            coal = float(row["coal"] or 0)
            oil = float(row["oil"] or 0)

            total = others + biofuels + solar + wind + hydro + nuclear + gas + coal + oil
            mix = oil / total
            
            if year not in result:
                continue
            if country_code not in result[year]:
                continue
            
            result[year][country_code]["mix"] = mix


with open('./Data/population.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        code = row["Code"]        
        if code != "":
            year = row["Year"]
            country_code = row["Code"]
            population = int(row["Population (historical estimates)"])
            country = row["Entity"]
            if year not in result:
                continue
            if country_code not in result[year]:
                continue
            
            result[year][country_code]["population"] = population

with open('./Data/oil.json', 'w') as outfile:
    json.dump(result, outfile)